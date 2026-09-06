import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// DATABASE_URL merret nga .env / variablat e mjedisit.
// Nëse mungon (p.sh. ndërtim në mjedis pa sekrete), përdoret
// parazgjedhja lokale e zhvillimit me një paralajmërim të qartë.
const DEFAULT_LOCAL_URL = "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    [
      "",
      "[kriel] DATABASE_URL nuk u gjet te variablat e mjedisit.",
      "        Po përdoret parazgjedhja lokale: " + DEFAULT_LOCAL_URL,
      "        Për ta ndryshuar, krijoni skedarin .env me:",
      "        DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME",
      "",
    ].join("\n")
  );
  databaseUrl = DEFAULT_LOCAL_URL;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
