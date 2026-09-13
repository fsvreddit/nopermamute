import { OnModActionRequest, TriggerResponse } from "@devvit/web/shared";
import { Context } from "hono";
import { handleUnmuteAction, handleMuteAction } from "../core";

export const handleModAction = async (c: Context) => {
    const request = await c.req.json<OnModActionRequest>();

    if (request.action === "muteuser" && request.targetUser) {
        await handleMuteAction(request.targetUser.name);
    }

    if (request.action === "unmuteuser" && request.targetUser) {
        await handleUnmuteAction(request.targetUser.name);
    }

    return c.json<TriggerResponse>({ message: "mod action handled" }, 200);
};
