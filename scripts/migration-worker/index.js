import { connect } from 'cloudflare:sockets';

const WORKER_SECRET = 'sgf-migration-2024';

async function scram256(password, user, serverContinueMsg) {
  const enc = new TextEncoder();
  const parts = {};
  for (const p of serverContinueMsg.split(',')) parts[p[0]] = p.slice(2);

  const salt = Uint8Array.from(atob(parts.s), c => c.charCodeAt(0));
  const iterations = parseInt(parts.i);

  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltedPwBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    pwKey, 256
  );
  const saltedPw = new Uint8Array(saltedPwBits);

  const hmacSign = async (key, data) => {
    const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
  };

  const clientKey = await hmacSign(saltedPw, 'Client Key');
  const storedKey = new Uint8Array(await crypto.subtle.digest('SHA-256', clientKey));
  const xor = (a, b) => a.map((byte, i) => byte ^ b[i]);
  const b64 = (bytes) => btoa(String.fromCharCode(...bytes));

  return { clientKey, storedKey, xor, b64, parts };
}

function int32(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setInt32(0, n, false);
  return b;
}

function int16(n) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setInt16(0, n, false);
  return b;
}

function concat(...parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { buf.set(p, off); off += p.length; }
  return buf;
}

function message(type, payload) {
  const enc = new TextEncoder();
  const p = typeof payload === 'string' ? enc.encode(payload) : payload;
  return concat(
    new Uint8Array([type.charCodeAt(0)]),
    int32(4 + p.length),
    p
  );
}

async function execSql(password, sql) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  // Connect sem SSL (Supabase aceita plain text internamente)
  const socket = connect(
    { hostname: 'db.bjsbbmxkixodgjlaudkf.supabase.co', port: 5432 },
    { secureTransport: 'off', allowHalfOpen: false }
  );
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();

  let buf = new Uint8Array(0);

  async function fill(needed, ms = 15000) {
    const deadline = Date.now() + ms;
    while (buf.length < needed && Date.now() < deadline) {
      const remain = deadline - Date.now();
      if (remain <= 0) break;
      let resolved = false;
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise((_, r) => setTimeout(() => { if (!resolved) r(new Error('read timeout')); }, Math.min(remain, 5000)))
      ]).catch(e => { throw new Error('fill: ' + e.message); });
      resolved = true;
      if (done || !value) break;
      const m = new Uint8Array(buf.length + value.length);
      m.set(buf); m.set(value, buf.length);
      buf = m;
    }
  }

  async function nextMsg(ms = 15000) {
    await fill(5, ms);
    const type = String.fromCharCode(buf[0]);
    const len = new DataView(buf.buffer, buf.byteOffset + 1).getInt32(0, false);
    await fill(1 + len, ms);
    const payload = buf.slice(5, 1 + len);
    buf = buf.slice(1 + len);
    return { type, payload };
  }

  async function write(data) { await writer.write(data); }

  // Startup
  const startupParams = concat(
    int32(196608), // protocol 3.0
    enc.encode('user\0postgres\0database\0postgres\0client_encoding\0UTF8\0\0')
  );
  await write(concat(int32(4 + startupParams.length), startupParams));

  // Auth
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));
  const clientFirstBare = `n=postgres,r=${nonce}`;
  let serverContinue = '';
  let authOk = false;

  while (!authOk) {
    const { type, payload } = await nextMsg();
    if (type === 'E') throw new Error('Auth: ' + dec.decode(payload).replace(/\0/g,' ').slice(1, 200));
    if (type === 'S' || type === 'K') continue;
    if (type === 'Z') { authOk = true; break; }
    if (type !== 'R') continue;

    const authType = new DataView(payload.buffer, payload.byteOffset).getInt32(0, false);
    if (authType === 0) { authOk = true; }
    else if (authType === 5) {
      // MD5
      const salt = payload.slice(4, 8);
      const i1 = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(password + 'postgres')));
      const i1hex = [...i1].map(b=>b.toString(16).padStart(2,'0')).join('');
      // MD5 not available in Web Crypto — use PBKDF2 trick: just send plaintext "password" and let Supabase handle it
      // Actually we need real MD5. Let's compute it manually.
      const md5 = (data) => {
        // Simple MD5 via Uint8Array — we'll just send the password directly and hope SCRAM-SHA-256 is used
        // This is a placeholder - we'll use SCRAM-SHA-256 instead
        return new Uint8Array(16);
      };
      throw new Error('MD5 auth not supported, need SCRAM-SHA-256');
    }
    else if (authType === 10) {
      // SASL - send SCRAM-SHA-256 client first
      const saslMech = 'SCRAM-SHA-256';
      const clientFirst = `n,,${clientFirstBare}`;
      const cfBytes = enc.encode(clientFirst);
      const mechBytes = enc.encode(saslMech + '\0');
      const payload2 = concat(mechBytes, int32(cfBytes.length), cfBytes);
      await write(message('p', payload2));
    }
    else if (authType === 11) {
      // SASL Continue
      serverContinue = dec.decode(payload.slice(4));
      const { clientKey, storedKey, xor, b64, parts } = await scram256(password, 'postgres', serverContinue);

      const clientFinalNP = `c=biws,r=${parts.r}`;
      const authMsg = `${clientFirstBare},${serverContinue},${clientFinalNP}`;

      const skKey = await crypto.subtle.importKey('raw', storedKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const clientSig = new Uint8Array(await crypto.subtle.sign('HMAC', skKey, enc.encode(authMsg)));
      const proof = b64(xor(clientKey, clientSig));
      const clientFinal = `${clientFinalNP},p=${proof}`;
      await write(message('p', enc.encode(clientFinal)));
    }
    else if (authType === 12) { continue; } // SASL Final — next msg will be R(0) or Z
  }

  // Execute query
  await write(message('Q', enc.encode(sql + '\0')));

  // Read results
  const rows = [];
  let colNames = [];
  let command = '';
  let queryErr = null;
  let ready = false;

  while (!ready) {
    const { type, payload } = await nextMsg(30000);
    const view = new DataView(payload.buffer, payload.byteOffset);

    if (type === 'T') {
      const n = view.getInt16(0, false);
      let p = 2;
      for (let i = 0; i < n; i++) {
        let e = p; while (payload[e] !== 0) e++;
        colNames.push(dec.decode(payload.slice(p, e)));
        p = e + 1 + 6 * 3; // skip null + tableoid(4) + attnum(2) + typid(4) + typlen(2) + typmod(4) + format(2) = 18 bytes
      }
    } else if (type === 'D') {
      const n = view.getInt16(0, false);
      const row = {};
      let p = 2;
      for (let i = 0; i < n; i++) {
        const clen = view.getInt32(p, false); p += 4;
        row[colNames[i] || i] = clen < 0 ? null : dec.decode(payload.slice(p, p + clen));
        if (clen > 0) p += clen;
      }
      rows.push(row);
    } else if (type === 'C') {
      command = dec.decode(payload).replace(/\0/g, '');
    } else if (type === 'Z') {
      ready = true;
    } else if (type === 'E') {
      queryErr = dec.decode(payload).replace(/\0/g, ' ').slice(1, 300);
    }
  }

  try { await writer.close(); } catch {}
  if (queryErr) throw new Error(queryErr);
  return { rows, command };
}

export default {
  async fetch(request, env) {
    if (request.method === 'GET') return new Response('SGF Migration Worker v6', { status: 200 });

    const auth = request.headers.get('Authorization');
    if (auth !== 'Bearer ' + WORKER_SECRET) return new Response('Unauthorized', { status: 401 });

    const { sql } = await request.json().catch(() => ({}));
    if (!sql) return new Response(JSON.stringify({ error: 'sql required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    try {
      const result = await execSql(env.DB_PASSWORD, sql);
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch(err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
