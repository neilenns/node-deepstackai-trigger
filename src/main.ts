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
import TriggerManager from "./TriggerManager";

let triggerManager: TriggerManager;

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
    if (!validateEnvironmentVariables()) {
      throw Error(
        `At least one required environment variable is missing. Ensure all required environment variables are set then run again.`,
      );
    }

    // Load the trigger details
    triggerManager = new TriggerManager();
    await triggerManager.loadTriggers("/run/secrets/triggers");
    await MqttManager.loadConfiguration("/run/secrets/mqtt");
    await TelegramManager.loadConfiguration("/run/secrets/telegram");

    // Start watching
    triggerManager.startWatching();

    wait();
  } catch (e) {
    log.error("Main", e.message);
    process.exit(1);
  }
}

function wait() {
  setTimeout(wait, 1000);
}

main();
