import { TriggerResponse } from "@devvit/web/shared";
import { Context } from "hono";
import { context } from "@devvit/web/server";
import { scheduleJobs } from "../core";

export const handleAppUpgrade = async (c: Context) => {
    console.log(`App Upgrade: Upgraded in subreddit ${context.subredditName} to version ${context.appVersion}`);

    await scheduleJobs();

    return c.json<TriggerResponse>({ message: "app upgrade handled" }, 200);
};
