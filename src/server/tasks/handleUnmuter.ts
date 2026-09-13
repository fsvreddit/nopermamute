import { TaskRequest, TaskResponse } from "@devvit/web/server";
import type { Context } from "hono";
import { AdhocJobData, handleUnmuter, SchedulerJob } from "../core";
import { hasTriggerBeenHandled } from "@fsvreddit/fsv-devvit-web-helpers";
import { addMinutes } from "date-fns";

export const handleUnmuterJob = async (c: Context) => {
    const request = await c.req.json<TaskRequest<AdhocJobData | undefined>>();

    if (request.data?.jobGuid) {
        if (await hasTriggerBeenHandled(`job:${request.data.jobGuid}`, { expiration: addMinutes(new Date(), 1) })) {
            return c.json<TaskResponse>({ message: "adhoc unmuter job already handled" }, 200);
        }
    }

    if (!request.data?.jobGuid && await hasTriggerBeenHandled(`job:${SchedulerJob.HandleUnmuter}`, { expiration: addMinutes(new Date(), 1) })) {
        return c.json<TaskResponse>({ message: "unmuter job already handled" }, 200);
    }

    await handleUnmuter();

    return c.json<TaskResponse>({ message: "unmuter job completed" }, 200);
};
