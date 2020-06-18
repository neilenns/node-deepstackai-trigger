/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as helpers from "./helpers";
import * as log from "./Log";

import ITriggerConfigJson from "./types/ITriggerConfigJson";
import MqttHandlerConfig from "./handlers/mqttManager/MqttHandlerConfig";
import PushoverConfig from "./handlers/pushoverManager/PushoverConfig";
import Rect from "./Rect";
import TelegramConfig from "./handlers/telegramManager/TelegramConfig";
import Trigger from "./Trigger";
import WebRequestConfig from "./handlers/webRequest/WebRequestConfig";

/**
 * Provides a running total of the number of times an image caused triggers
 * to fire. Use the incrementTriggeredCount() method to update the total.
 */
export let triggeredCount = 0;

/**
 * Provides a running total of the number of files analyzed.
 * Use the incrementAnalyzedFiles() method to update the total.
 */
export let analyzedFilesCount = 0;

/**
 * The list of all the triggers managed by this.
 */
let _triggers: Trigger[];

/**
 * Takes a path to a configuration file and loads all of the triggers from it.
 * @param configFilePath The path to the configuration file
 */
export function loadConfiguration(configFilePaths: string[]): void {
  let loadedConfigFilePath: string;

  let triggerConfigJson: ITriggerConfigJson;

  // Look through the list of possible loadable config files and try loading
  // them in turn until a valid one is found.
  configFilePaths.some(configFilePath => {
    triggerConfigJson = helpers.readSettings<ITriggerConfigJson>("Triggers", configFilePath);

    if (!triggerConfigJson) {
      return false;
    }

    loadedConfigFilePath = configFilePath;
    return true;
  });

  // At this point there were no loadable files so bail.
  if (!triggerConfigJson) {
    throw Error(
      "Unable to find a trigger configuration file. Verify the trigger secret points to a file " +
        "called triggers.json or that the /config mount point contains a file called triggers.json.",
    );
  }

  log.info("Triggers", `Loaded configuration from ${loadedConfigFilePath}`);

  _triggers = triggerConfigJson.triggers.map(triggerJson => {
    log.info("Triggers", `Loaded configuration for ${triggerJson.name}`);
    const configuredTrigger = new Trigger({
      cooldownTime: triggerJson.cooldownTime,
      enabled: triggerJson.enabled ?? true, // If it isn't specified then enable the camera
      name: triggerJson.name,
      threshold: {
        minimum: triggerJson?.threshold?.minimum ?? 0, // If it isn't specified then just assume always trigger.
        maximum: triggerJson?.threshold?.maximum ?? 100, // If it isn't specified then just assume always trigger.
      },
      watchPattern: triggerJson.watchPattern,
      watchObjects: triggerJson.watchObjects,
    });

    // Set up the masks as real objects
    configuredTrigger.masks = triggerJson.masks?.map(
      mask => new Rect(mask.xMinimum, mask.yMinimum, mask.xMaximum, mask.yMaximum),
    );

    // Set up the handlers
    if (triggerJson.handlers.webRequest) {
      configuredTrigger.webRequestHandlerConfig = new WebRequestConfig(triggerJson.handlers.webRequest);
    }
    if (triggerJson.handlers.mqtt) {
      configuredTrigger.mqttHandlerConfig = new MqttHandlerConfig(triggerJson.handlers.mqtt);
    }
    if (triggerJson.handlers.telegram) {
      configuredTrigger.telegramConfig = new TelegramConfig(triggerJson.handlers.telegram);
    }
    if (triggerJson.handlers.pushover) {
      configuredTrigger.pushoverConfig = new PushoverConfig(triggerJson.handlers.pushover);
    }

    return configuredTrigger;
  });
}

/**
 * Start all registered triggers watching for changes.
 */
export function startWatching(): void {
  _triggers.map(trigger => trigger.startWatching());
}

/**
 * Stops all registered triggers from watching for changes.
 */
export async function stopWatching(): Promise<void[]> {
  return Promise.all(_triggers.map(trigger => trigger.stopWatching()));
}

/**
 * Adds one to the triggered count total.
 */
export function incrementTriggeredCount(): void {
  triggeredCount += 1;
}

/**
 * Adds one to the false positive count total.
 */
export function incrementAnalyzedFilesCount(): void {
  analyzedFilesCount += 1;
}
