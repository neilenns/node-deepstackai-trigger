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
import IConfiguration from "./types/IConfiguration";

import npmPackageInfo from "../package.json";

// Health message is sent via MQTT every 60 seconds
const healthWaitTime = 60 * 1000;
// If startup fails restart is reattempted 5 times every 30 seconds.
const restartAttemptWaitTime = 30 * 1000;
const maxRestartAttempts = 5;

// The list of settings file watchers, used to stop them on hot reloading of settings.
const watchers: chokidar.FSWatcher[] = [];

let healthTimer: NodeJS.Timeout;
let restartAttemptCount = 0;
let restartTimer: NodeJS.Timeout;
let settingsConfiguration: IConfiguration;
let triggersConfiguration: IConfiguration;

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
    settingsConfiguration = Settings.loadConfiguration([
      {
        baseFilePath: "/run/secrets/settings",
        secretsFilePath: "/run/secrets/secrets",
      },
      {
        baseFilePath: "/config/settings.json",
        secretsFilePath: "/config/secrets.json",
      },
    ]);

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

    // Load the trigger configuration. Verifying the location is just a quick check for basic
    // mounting issues. It doesn't stop the startup of the system since globs are valid in
    // watchObject paths and that's not something that can easily be verified.
    triggersConfiguration = TriggerManager.loadConfiguration([
      {
        baseFilePath: "/run/secrets/triggers",
        secretsFilePath: "/run/secrets/secrets",
      },
      {
        baseFilePath: "/config/triggers.json",
        secretsFilePath: "/config/secrets.json",
      },
    ]);
    TriggerManager.verifyTriggerWatchLocations();

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
    sendHealthMessage();

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
    clearTimeout(healthTimer);
    await MqttManager.publishServerState("offline", e.message);

    // Shutdown the web server plus other things that may have spun up successfully.
    await shutdown();

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
 * Sends a health message via MQTT every n seconds to indicate the server is online.
 */
async function sendHealthMessage(): Promise<void> {
  if (!MqttManager.isEnabled) {
    return;
  }

  await MqttManager.publishServerState("online");

  healthTimer = setTimeout(sendHealthMessage, healthWaitTime);
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
async function hotLoadSettings(configuration: IConfiguration) {
  log.info("Main", `${configuration.baseFilePath} change detected, reloading.`);

  await shutdown();
  await startup();
}

/**
 * Reloads the list of triggers.
 * @param path The path to the trigger file that changed.
 */
async function hotLoadTriggers(configuration: IConfiguration) {
  log.info("Main", `${configuration.baseFilePath} change detected, reloading.`);

  // Shut down things that are running
  await TriggerManager.stopWatching();

  // Load the trigger configuration. Verifying the location is just a quick check for basic
  // mounting issues. It doesn't stop the startup of the system since globs are valid in
  // watchObject paths and that's not something that can easily be verified.
  TriggerManager.loadConfiguration([configuration]);
  TriggerManager.verifyTriggerWatchLocations();

  TriggerManager.startWatching();
}

/**
 * Starts watching for changes to settings files
 */
function startWatching(): void {
  const settingsFilePath = settingsConfiguration.baseFilePath;
  try {
    if (settingsFilePath) {
      watchers.push(
        chokidar
          .watch(settingsFilePath, { awaitWriteFinish: Settings.awaitWriteFinish })
          .on("change", () => hotLoadSettings(settingsConfiguration)),
      );
      log.verbose("Main", `Watching for changes to ${settingsFilePath}`);
    }
  } catch (e) {
    log.warn("Main", `Unable to watch for changes to ${settingsFilePath}: ${e}`);
  }

  const triggersFilePath = triggersConfiguration.baseFilePath;
  try {
    if (triggersFilePath) {
      watchers.push(
        chokidar
          .watch(triggersFilePath, { awaitWriteFinish: Settings.awaitWriteFinish })
          .on("change", () => hotLoadTriggers(triggersConfiguration)),
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
async function stopWatching(): Promise<void[]> {
  return Promise.all(
    watchers.map(async watcher => {
      await watcher.close();
    }),
  );
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
