/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// See https://github.com/yagop/node-telegram-bot-api/issues/319
process.env.NTBA_FIX_319 = "true";

import * as chokidar from "chokidar";
import * as LocalStorageManager from "./LocalStorageManager";
import * as log from "./Log";
import * as MqttManager from "./handlers/mqttManager/MqttManager";
import * as PushoverManager from "./handlers/pushoverManager/PushoverManager";
import * as Settings from "./Settings";
import * as TelegramManager from "./handlers/telegramManager/TelegramManager";
import * as TriggerManager from "./TriggerManager";
import * as WebServer from "./WebServer";

import npmPackageInfo from "../package.json";

let settingsFilePath: string;
let settingsWatcher: chokidar.FSWatcher;
let triggersFilePath: string;
let triggersWatcher: chokidar.FSWatcher;

function validateEnvironmentVariables(): boolean {
  let isValid = true;

  if (!process.env.TZ) {
    log.error("Main", "Required environment variable TZ is missing.");
    isValid = false;
  }

  return isValid;
}

async function startup(): Promise<void> {
  log.info("Main", `Starting up version ${npmPackageInfo.version}`);
  log.info("Main", `Timezone offset is ${new Date().getTimezoneOffset()}`);
  log.info("Main", `Current time is ${new Date()}`);

  try {
    // Load the settings file.
    settingsFilePath = Settings.loadConfiguration(["/run/secrets/settings", "/config/settings.json"]);

    // MQTT manager loads first so if it succeeds but other things fail we can report the failures via MQTT.
    await MqttManager.initialize();

    // Check the environment variables are right.
    if (!validateEnvironmentVariables()) {
      throw Error(
        `At least one required environment variable is missing. Ensure all required environment variables are set then run again.`,
      );
    }

    // To make things simpler just enable local storage all the time. It won't
    // do anything harmful if it's unused, just the occasional background purge
    // that runs.
    await LocalStorageManager.initializeStorage();
    LocalStorageManager.startBackgroundPurge();

    // Purely for logging information.
    if (Settings.enableAnnotations) {
      log.info("Main", "Annotated image generation enabled.");
    }

    // Enable the web server.
    if (Settings.enableWebServer) {
      log.info("Main", "Web server enabled.");
      WebServer.startApp();
    }

    // Load the trigger configuration.
    triggersFilePath = TriggerManager.loadConfiguration(["/run/secrets/triggers", "/config/triggers.json"]);

    // Initialize the other two handler managers. MQTT got done earlier
    // since it does double-duty and sends overall status messages for the system.
    await TelegramManager.initialize();
    await PushoverManager.initialize();

    // Start watching
    TriggerManager.startWatching();

    // Notify it's up and running
    await MqttManager.publishServerState("online");

    log.info("Main", "****************************************");
    log.info("Main", "Up and running!");
  } catch (e) {
    log.error("Main", e.message);
    log.error("Main", "****************************************");
    log.error(
      "Main",
      "Startup cancelled due to errors. For troubleshooting assistance see https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Troubleshooting.",
    );
    // Notify it's not up and running
    await MqttManager.publishServerState("offline", e.message);
  }
}

async function hotLoad(path: string) {
  log.info("Main", `${path} change detected, reloading.`);

  // Shut down things that are running
  TriggerManager.stopWatching();
  WebServer.stopApp();

  // Start it all back up again
  await startup();
}

function startWatching(): void {
  try {
    if (settingsFilePath) {
      settingsWatcher = chokidar
        .watch(settingsFilePath, { awaitWriteFinish: Settings.awaitWriteFinish })
        .on("change", path => hotLoad(path));
      log.verbose("Main", `Watching for changes to ${settingsFilePath}`);
    }
  } catch (e) {
    log.warn("Main", `Unable to watch for changes to ${settingsFilePath}: ${e}`);
  }

  try {
    if (triggersFilePath) {
      triggersWatcher = chokidar
        .watch(triggersFilePath, { awaitWriteFinish: Settings.awaitWriteFinish })
        .on("change", path => hotLoad(path));
      log.verbose("Main", `Watching for changes to ${triggersFilePath}`);
    }
  } catch (e) {
    log.warn("Main", `Unable to watch for changes to ${triggersFilePath}: ${e}`);
  }
}

async function main() {
  await startup();

  startWatching();

  // Spin in circles waiting for new files to arrive.
  wait();
}

function wait() {
  setTimeout(wait, 1000);
}

main();
