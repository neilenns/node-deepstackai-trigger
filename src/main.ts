/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// See https://github.com/yagop/node-telegram-bot-api/issues/319
process.env.NTBA_FIX_319 = "true";

import * as AnnotationManager from "./handlers/annotationManager/AnnotationManager";
import * as chokidar from "chokidar";
import * as LocalStorageManager from "./LocalStorageManager";
import * as log from "./Log";
import * as MqttManager from "./handlers/mqttManager/MqttManager";
import * as MqttRouter from "./MqttRouter";
import * as PushbulletManager from "./handlers/pushbulletManager/PushbulletManager";
import * as PushoverManager from "./handlers/pushoverManager/PushoverManager";
import * as Settings from "./Settings";
import * as TelegramManager from "./handlers/telegramManager/TelegramManager";
import * as TriggerManager from "./TriggerManager";
import * as WebServer from "./WebServer";

import npmPackageInfo from "../package.json";

// If startup fails restart is reattempted 5 times every 30 seconds.
const restartAttemptWaitTime = 5 * 1000;
const maxRestartAttempts = 5;

// The list of settings file watchers, used to stop them on hot reloading of settings.
const watchers: chokidar.FSWatcher[] = [];

let restartAttemptCount = 0;
let restartTimer: NodeJS.Timeout;
let settingsFilePath: string;
let triggersFilePath: string;

function validateEnvironmentVariables(): boolean {
  let isValid = true;

  if (!process.env.TZ) {
    log.error("Main", "Required environment variable TZ is missing.");
    isValid = false;
  }

  return isValid;
}

async function startup(): Promise<void> {
  log.info("Main", "****************************************");
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

    if (Settings.enableAnnotations) {
      log.info("Main", "Annotated image generation enabled.");
      await AnnotationManager.initialize();
    }

    // Enable the web server.
    if (Settings.enableWebServer) {
      log.info("Main", "Web server enabled.");
      WebServer.startApp();
    }

    // Load the trigger configuration.
    triggersFilePath = TriggerManager.loadConfiguration(["/run/secrets/triggers", "/config/triggers.json"]);

    // Initialize the other handler managers. MQTT got done earlier
    // since it does double-duty and sends overall status messages for the system.
    await PushbulletManager.initialize();
    await PushoverManager.initialize();
    await TelegramManager.initialize();

    // Start listening for MQTT events
    await MqttRouter.initialize();

    // Start watching
    TriggerManager.startWatching();

    // Notify it's up and running
    await MqttManager.publishServerState("online");

    // Start watching for config file changes
    startWatching();

    // At this point startup succeeded so reset the restart count. This is in case
    // later hot reloads cause something to break, it should still support multiple
    // restarts.
    restartAttemptCount = 0;

    log.info("Main", "****************************************");
    log.info("Main", "Up and running!");
  } catch (e) {
    log.error("Main", e.message);
    log.error("Main", "****************************************");
    log.error(
      "Main",
      "Startup failed due to errors. For troubleshooting assistance see https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Troubleshooting.",
    );

    // Notify it's not up and running
    await MqttManager.publishServerState("offline", e.message);

    restartAttemptCount++;

    // Try starting again in a little bit.
    if (restartAttemptCount < maxRestartAttempts) {
      log.info(
        "Main",
        `Startup reattempt ${restartAttemptCount} of ${maxRestartAttempts} in ${restartAttemptWaitTime /
          1000} seconds.`,
      );
      restartTimer = setTimeout(startup, restartAttemptWaitTime);
    } else {
      log.error(
        "Main",
        `Startup failed ${maxRestartAttempts} times. For troubleshooting assistance see https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Troubleshooting.`,
      );
      return;
    }
  }
}

/**
 * Shuts down all registered file system watchers and the web server
 */
async function shutdown(): Promise<void> {
  clearTimeout(restartTimer);

  // Shut down things that are running
  await stopWatching();
  await TriggerManager.stopWatching();
  await WebServer.stopApp();
}

/**
 * Shuts everything down and then restarts the service with a new settings file.
 * @param path The path to the settings file that changed.
 */
async function hotLoadSettings(path: string) {
  log.info("Main", `${path} change detected, reloading.`);

  await shutdown();
  await startup();
}

/**
 * Reloads the list of triggers.
 * @param path The path to the trigger file that changed.
 */
async function hotLoadTriggers(path: string) {
  log.info("Main", `${path} change detected, reloading.`);

  // Shut down things that are running
  await TriggerManager.stopWatching();

  TriggerManager.loadConfiguration([path]);
  TriggerManager.startWatching();
}

/**
 * Starts watching for changes to settings files
 */
function startWatching(): void {
  try {
    if (settingsFilePath) {
      watchers.push(
        chokidar
          .watch(settingsFilePath, { awaitWriteFinish: Settings.awaitWriteFinish })
          .on("change", path => hotLoadSettings(path)),
      );
      log.verbose("Main", `Watching for changes to ${settingsFilePath}`);
    }
  } catch (e) {
    log.warn("Main", `Unable to watch for changes to ${settingsFilePath}: ${e}`);
  }

  try {
    if (triggersFilePath) {
      watchers.push(
        chokidar
          .watch(triggersFilePath, { awaitWriteFinish: Settings.awaitWriteFinish })
          .on("change", path => hotLoadTriggers(path)),
      );
      log.verbose("Main", `Watching for changes to ${triggersFilePath}`);
    }
  } catch (e) {
    log.warn("Main", `Unable to watch for changes to ${triggersFilePath}: ${e}`);
  }
}

/**
 * Stops watching for settings file changes.
 */
async function stopWatching(): Promise<void> {
  watchers.map(async watcher => {
    await watcher.close();
  });
}

/**
 * Shut down gracefully when requested.
 */
async function handleDeath(): Promise<void> {
  log.info("Main", "Shutting down.");
  await shutdown();
  process.exit();
}

function registerForDeath(): void {
  process.on("SIGINT", handleDeath);
  process.on("SIGTERM", handleDeath);
  process.on("SIGQUIT", handleDeath);
  process.on("SIGBREAK", handleDeath);
}

async function main(): Promise<void> {
  registerForDeath();

  await startup();

  // Spin in circles waiting for new files to arrive.
  wait();
}

function wait() {
  setTimeout(wait, 1000);
}

main();
