import { TaskRequest, TaskResponse } from "@devvit/web/server";
import type { Context } from "hono";
import { AdhocJobData, storeInitialMutedUsers } from "../core";
import { hasTriggerBeenHandled } from "@fsvreddit/fsv-devvit-web-helpers";

export const handleInitialMutePopulation = async (c: Context) => {
    const request = await c.req.json<TaskRequest<AdhocJobData>>();

    if (await hasTriggerBeenHandled(`job:${request.data.jobGuid}`)) {
        console.warn(`Job with GUID ${request.data.jobGuid} has already been handled`);
        return c.json<TaskResponse>({ message: "job already handled" }, 200);
    }

    await storeInitialMutedUsers();

    return c.json<TaskResponse>({ message: "initial mute population job completed" }, 200);
};
