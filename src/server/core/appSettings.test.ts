import assert from "node:assert/strict";
import { describe, it } from "vitest";
import devvitConfig from "../../../devvit.json";
import { AppSetting } from "./appSettings.js";

interface DevvitSetting {
    type?: string;
    fields?: Record<string, DevvitSetting>;
}

function collectNonGroupSettingKeys (settingsMap: Record<string, DevvitSetting>): string[] {
    const keys: string[] = [];

    for (const [settingKey, settingValue] of Object.entries(settingsMap)) {
        if (settingValue.type === "group") {
            if (settingValue.fields !== undefined) {
                keys.push(...collectNonGroupSettingKeys(settingValue.fields));
            }
            continue;
        }

        keys.push(settingKey);
    }

    return keys;
}

const configSettingKeys = collectNonGroupSettingKeys(devvitConfig.settings.subreddit).sort();

const appSettingValues: string[] = Object.values(AppSetting).sort();

describe("AppSetting configuration parity", () => {
    it("has a devvit.json setting for every AppSetting enum value", () => {
        const missingFromConfig = appSettingValues.filter(setting => !configSettingKeys.includes(setting));

        assert.deepEqual(missingFromConfig, []);
    });

    it("has an AppSetting enum value for every devvit.json setting", () => {
        const missingFromEnum = configSettingKeys.filter(setting => !appSettingValues.includes(setting));

        assert.deepEqual(missingFromEnum, []);
    });
});
