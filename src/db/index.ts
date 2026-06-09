import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://devroast:devroast@localhost:5432/devroast',
});

export const db = drizzle(pool, { schema, casing: 'snake_case' });
