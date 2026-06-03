/**
 * Aplica migrations SQL no banco Supabase via conexão direta.
 * Uso: node scripts/run-migrations.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

const DB_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:MinhaS3nha@2024@db.bjsbbmxkixodgjlaudkf.supabase.co:5432/postgres';

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function rodar() {
  await client.connect();
  console.log('✅ Conectado ao banco\n');

  const arquivos = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const arquivo of arquivos) {
    const sql = readFileSync(join(MIGRATIONS_DIR, arquivo), 'utf-8');
    console.log(`▶️  Aplicando: ${arquivo}`);
    try {
      await client.query(sql);
      console.log(`✅ ${arquivo} aplicado com sucesso\n`);
    } catch (err) {
      console.error(`❌ Erro em ${arquivo}: ${err.message}\n`);
    }
  }

  await client.end();
  console.log('✅ Migrations concluídas!');
}

rodar().catch(console.error);
