import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Logger } from "@nestjs/common";
import * as schemas from "./schema/index";


const logger = new Logger("DatabaseProvider");

export const DatabaseProvider = {
  provide: "DRIZZLE",
  useFactory: async () => {
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: false,
    });

    // Test connection
    try {
      const client = await pool.connect();
      const result = await client.query("SELECT NOW()");
      client.release();
      logger.log("✅ Database connected successfully!");
      logger.debug(`Current time from DB: ${result.rows[0].now}`);
    } catch (error) {
      logger.error("❌ Failed to connect to database:", error.message);
      throw new Error("Database connection failed");
    }

    // IMPORTANT PART 👇
    return drizzle(pool, { schema: schemas });
  },
};
