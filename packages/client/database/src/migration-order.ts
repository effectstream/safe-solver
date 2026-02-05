import type { DBMigrations } from "@paimaexample/runtime";
import databaseSql from "./migrations/database.sql" with { type: "text" };
import gameInfoSeedSql from "./migrations/game-info-seed.sql" with { type: "text" };
import achievementsSeedSql from "./migrations/achievements-seed.sql" with { type: "text" };

export const migrationTable: DBMigrations[] = [
  {
    name: "database.sql",
    sql: databaseSql,
  },
  {
    name: "game-info-seed.sql",
    sql: gameInfoSeedSql,
  },
  {
    name: "achievements-seed.sql",
    sql: achievementsSeedSql,
  },
];
