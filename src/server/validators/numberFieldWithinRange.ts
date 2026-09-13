import { SettingsValidationRequest, SettingsValidationResponse } from "@devvit/web/shared";
import type { Context } from "hono";

export const handleMuteDurationWithinRange = async (c: Context) => {
    const validationRequest = await c.req.json<SettingsValidationRequest<number>>();

    if (validationRequest.value === undefined || validationRequest.value < 28 || validationRequest.value > 56 || !Number.isInteger(validationRequest.value)) {
        return c.json<SettingsValidationResponse>({
            success: false,
            error: "Value must be a whole number between 28 and 56.",
        });
    }

    return c.json<SettingsValidationResponse>({ success: true }, 200);
};
