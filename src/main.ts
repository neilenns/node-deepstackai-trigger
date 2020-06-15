/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// See https://github.com/yagop/node-telegram-bot-api/issues/319
process.env.NTBA_FIX_319 = "true";
import npmPackageInfo from "../package.json";
import * as AnnotationManager from "./handlers/annotationManager/AnnotationManager";
import * as MqttManager from "./handlers/mqttManager/MqttManager";
import * as TelegramManager from "./handlers/telegramManager/TelegramManager";
import * as log from "./Log";
import * as TriggerManager from "./TriggerManager";
import * as LocalStorageManager from "./LocalStorageManager";
import * as WebServer from "./WebServer";
import * as helpers from "./helpers";

let purgeInterval = 30;
let purgeAge = 60;

function validateEnvironmentVariables(): boolean {
  let isValid = true;

  if (!process.env.DEEPSTACK_URI) {
    log.error("Main", "Required environment variable DEEPSTACK_URI is missing.");
    isValid = false;
  }

  if (!process.env.TZ) {
    log.error("Main", "Required environment variable TZ is missing.");
    isValid = false;
  }

  // Get the purge interval and purge age from environment variables, with all sorts
  // of funky stuff to convert a string to a number nicely and not override
  // the default values if nothing valid was specified.
  const purgeIntervalValue = helpers.convertStringToNumber(process.env.PURGE_INTERVAL);
  if (purgeIntervalValue) {
    purgeInterval = purgeIntervalValue;
  }

  const purgeAgeValue = helpers.convertStringToNumber(process.env.PURGE_AGE);
  if (purgeAgeValue) {
    purgeAge = purgeAgeValue;
  }

  if (process.env.ENABLE_ANNOTATIONS) {
    AnnotationManager.enable();
  }

  return isValid;
}

async function main() {
  log.info("Main", `Starting up version ${npmPackageInfo.version}`);
  log.info("Main", `Timezone offset is ${new Date().getTimezoneOffset()}`);
  log.info("Main", `Current time is ${new Date()}`);

  try {
    // MQTT manager loads first so if it succeeds but other things fail
    // we can report the failures via MQTT.
    await MqttManager.loadConfiguration(["/run/secrets/mqtt", "/config/mqtt.json"]);

    if (!validateEnvironmentVariables()) {
      throw Error(
        `At least one required environment variable is missing. Ensure all required environment variables are set then run again.`,
      );
    }

    // Initialize the local storage and web server
    if (AnnotationManager.enabled) {
      await LocalStorageManager.initializeStorage();
      LocalStorageManager.startBackgroundPurge(purgeInterval, purgeAge);
      WebServer.startApp();
    } else {
      log.info("Main", "Annotated images are enabled due to presence of the ENABLE_ANNOTATIONS environment variable.");
    }

    await TriggerManager.loadConfiguration(["/run/secrets/triggers", "/config/triggers.json"]);
    await TelegramManager.loadConfiguration(["/run/secrets/telegram", "/config/telegram.json"]);

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

  wait();
}

function wait() {
  setTimeout(wait, 1000);
}

main();
