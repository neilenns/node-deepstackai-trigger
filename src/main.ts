/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// See https://github.com/yagop/node-telegram-bot-api/issues/319
process.env.NTBA_FIX_319 = "true";
import npmPackageInfo from "../package.json";
import * as MqttManager from "./handlers/mqttManager/MqttManager";
import * as TelegramManager from "./handlers/telegramManager/TelegramManager";
import * as log from "./Log";
import * as TriggerManager from "./TriggerManager";
import * as LocalStorageManager from "./LocalStorageManager";
import * as WebServer from "./WebServer";

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

    // Initialize the web storage
    await LocalStorageManager.initializeStorage();
    LocalStorageManager.startBackgroundPurge(30, 60);

    if (!validateEnvironmentVariables()) {
      throw Error(
        `At least one required environment variable is missing. Ensure all required environment variables are set then run again.`,
      );
    }

    await TriggerManager.loadConfiguration(["/run/secrets/triggers", "/config/triggers.json"]);
    await TelegramManager.loadConfiguration(["/run/secrets/telegram", "/config/telegram.json"]);
    WebServer.startApp();

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
