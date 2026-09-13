import { TriggerResponse } from "@devvit/web/shared";
import { Context } from "hono";
import { context, scheduler } from "@devvit/web/server";
import { AdhocJobData, SchedulerJob, scheduleJobs } from "../core";
import { addSeconds } from "date-fns";

export const handleAppInstall = async (c: Context) => {
    console.log(`App Install: Installed in subreddit ${context.subredditName} at version ${context.appVersion}`);

    await scheduleJobs();

    await scheduler.runJob<AdhocJobData>({
        name: SchedulerJob.HandleInitialMutePopulation,
        runAt: addSeconds(new Date(), 10),
        data: {
            jobGuid: crypto.randomUUID(),
        },
    });

    return c.json<TriggerResponse>({ message: "app install handled" }, 200);
};
