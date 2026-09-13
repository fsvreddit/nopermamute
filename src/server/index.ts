import { Hono } from "hono";
import { createServer, getServerPort } from "@devvit/web/server";
import { getRequestListener } from "@hono/node-server";
import { handleAppInstall, handleAppUpgrade, handleModAction } from "./triggers";
import { handleMuteDurationWithinRange } from "./validators";
import { handleUpgradeNotifier } from "@fsvreddit/fsv-devvit-web-helpers";
import { handleInitialMutePopulation, handleUnmuterJob } from "./tasks";

const application = new Hono();

// Triggers
application.post("/internal/triggers/on-app-install", handleAppInstall);
application.post("/internal/triggers/on-app-upgrade", handleAppUpgrade);
application.post("/internal/triggers/on-mod-action", handleModAction);

// Settings validators
application.post("/internal/validators/mute-duration-within-range", handleMuteDurationWithinRange);

// Scheduler jobs
application.post("/internal/tasks/handle-initial-mute-population", handleInitialMutePopulation);
application.post("/internal/tasks/handle-unmuter", handleUnmuterJob);
application.post("/internal/tasks/check-for-updates", handleUpgradeNotifier);

const server = createServer(getRequestListener(application.fetch));
server.on("error", (err) => {
    console.error(`server error; ${err.stack}`);
});

const port = getServerPort();
server.listen(port);
