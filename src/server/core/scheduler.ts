import { scheduler } from "@devvit/web/server";
import { UpgradeNotifierData } from "@fsvreddit/fsv-devvit-web-helpers";
import { AppSetting } from "./appSettings";

export enum SchedulerJob {
    HandleInitialMutePopulation = "handleInitialMutePopulation",
    HandleUnmuter = "handleUnmuter",
    CheckForUpdates = "checkForUpdates",
}

export type AdhocJobData = {
    jobGuid: string;
};

export async function scheduleJobs () {
    const existingJobs = await scheduler.listJobs().then(jobs => jobs.filter(job => "cron" in job));
    await Promise.all(existingJobs.map(job => scheduler.cancelJob(job.id)));

    let randomMinute = Math.floor(Math.random() * 60);

    await scheduler.runJob({
        name: SchedulerJob.HandleUnmuter,
        cron: `${randomMinute} * * * *`,
    });

    console.log(`Scheduler: Job ${SchedulerJob.HandleUnmuter} will run at minute ${randomMinute} of every hour`);

    randomMinute = Math.floor(Math.random() * 60);
    const randomHour = Math.floor(Math.random() * 24);

    await scheduler.runJob<UpgradeNotifierData>({
        name: SchedulerJob.CheckForUpdates,
        cron: `${randomMinute} ${randomHour} * * *`,
        data: {
            appFriendlyName: "No Permamute",
            settingName: AppSetting.NotifyOnUpdates,
        },
    });

    console.log(`Scheduler: Job ${SchedulerJob.CheckForUpdates} will run at minute ${randomMinute} of hour ${randomHour} every day`);
}
