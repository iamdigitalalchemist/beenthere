import { schedules, logger } from "@trigger.dev/sdk/v3";
import { getDatabasePool } from "../src/server/db";

export const eventAutoCloseTask = schedules.task({
  id: "event-auto-close",
  // Run every hour.
  cron: "0 * * * *",
  run: async () => {
    const pool = getDatabasePool();

    if (!pool) {
      throw new Error("POSTGRES_URL is not configured.");
    }

    const result = await pool.query<{ id: string; public_id: string }>(
      `update beenthere.events
          set status = 'ended'
        where status = 'active'
          and ends_at < now()
        returning id, public_id`,
    );

    logger.info("event_auto_close", { closed_count: result.rowCount, events: result.rows });

    return { closedCount: result.rowCount ?? 0 };
  },
});
