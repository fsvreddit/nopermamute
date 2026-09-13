import { context, reddit, redis, scheduler, settings, ZMember } from "@devvit/web/server";
import { AdhocJobData, AppSetting, SchedulerJob } from ".";
import { addSeconds, subDays } from "date-fns";
import pluralize from "pluralize";

const MUTED_USER_QUEUE_KEY = "MutedUserQueue";

/**
 * For whoever reviews this app - I am not doing any explicit content deletion policy checking here.
 * However, at the point that the unmute action is taken, even if the user has been deleted at that point
 * all records of them will be removed from Redis. I hope that this is acceptable.
 */

export async function handleMuteAction (username: string) {
    await redis.zAdd(MUTED_USER_QUEUE_KEY, { member: username, score: Date.now() });
    console.log(`Mute Action: ${username} has been muted and added to the queue.`);
}

export async function handleUnmuteAction (username: string) {
    const removed = await redis.zRem(MUTED_USER_QUEUE_KEY, [username]);
    console.log(`Unmute Action: ${username} has been unmuted, removed ${removed} from queue.`);
}

export async function storeInitialMutedUsers () {
    const muteActions = await reddit.getMutedUsers({
        subredditName: context.subredditName,
        limit: 1000,
    }).all().then(users => users.map(user => ({
        member: user.username,
        score: user.date.getTime(),
    } satisfies ZMember)));

    if (muteActions.length === 0) {
        console.log("Initial Mute Population: No muted users found.");
        return;
    }

    await redis.zAdd(MUTED_USER_QUEUE_KEY, ...muteActions);

    await scheduler.runJob<AdhocJobData>({
        name: SchedulerJob.HandleUnmuter,
        runAt: addSeconds(new Date(), 5),
        data: {
            jobGuid: crypto.randomUUID(),
        },
    });

    console.log(`Initial Mute Population: Added ${muteActions.length} ${pluralize("user", muteActions.length)} to the muted user queue.`);
}

async function checkAndUnmuteUser (username: string) {
    const userIsMuted = await reddit.getMutedUsers({
        subredditName: context.subredditName,
        username,
    }).all().then(users => users.length > 0);

    if (userIsMuted) {
        await reddit.unmuteUser(username, context.subredditName);
    }
}

export async function handleUnmuter () {
    const runLimit = addSeconds(new Date(), 20);

    const appSettings = await settings.getAll();
    if (!appSettings[AppSetting.EnableApp]) {
        return;
    }

    const muteDurationDays = appSettings[AppSetting.MuteDuration] as number | undefined ?? 28;

    const usersToCheck = await redis.zRange(MUTED_USER_QUEUE_KEY, 0, subDays(new Date(), muteDurationDays).getTime(), { by: "score" })
        .then(users => users.map(user => user.member));

    if (usersToCheck.length === 0) {
        console.log("Unmute Job: No users to unmute.");
        return;
    }

    let processed = 0;

    while (usersToCheck.length > 0 && new Date() < runLimit) {
        const username = usersToCheck.shift();
        if (!username) {
            break;
        }

        await checkAndUnmuteUser(username);
        await redis.zRem(MUTED_USER_QUEUE_KEY, [username]);
        processed++;
    }

    if (usersToCheck.length > 0) {
        await scheduler.runJob<AdhocJobData>({
            name: SchedulerJob.HandleUnmuter,
            runAt: addSeconds(new Date(), 5),
            data: {
                jobGuid: crypto.randomUUID(),
            },
        });
        console.log(`Unmute Job: Processed ${processed} ${pluralize("user", processed)}. Scheduled another run for remaining ${usersToCheck.length} ${pluralize("user", usersToCheck.length)}.`);
    } else {
        console.log(`Unmute Job: All users have been processed. Total processed: ${processed}`);
    }
}
