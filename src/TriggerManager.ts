/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as helpers from "./helpers";
import * as log from "./Log";
import * as MQTTManager from "./handlers/mqttManager/MqttManager";

import ITriggerConfigJson from "./types/ITriggerConfigJson";
import * as fs from "fs";
import MqttHandlerConfig from "./handlers/mqttManager/MqttHandlerConfig";
import path from "path";
import PushbulletConfig from "./handlers/pushbulletManager/PushbulletConfig";
import PushoverConfig from "./handlers/pushoverManager/PushoverConfig";
import Rect from "./Rect";
import TelegramConfig from "./handlers/telegramManager/TelegramConfig";
import Trigger from "./Trigger";
import WebRequestConfig from "./handlers/webRequest/WebRequestConfig";
import ITriggerStatistics from "./types/ITriggerStatistics";
import IConfiguration from "./types/IConfiguration";

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
export let triggers: Trigger[];

/**
 * Takes a path to a configuration file and loads all of the triggers from it.
 * @param configFilePath The path to the configuration file
 * @returns The path to the loaded configuration file
 */
export function loadConfiguration(configurations: IConfiguration[]): IConfiguration {
  let loadedConfiguration: IConfiguration;
  let triggerConfigJson: ITriggerConfigJson;

  // Reset triggers to empty in case this is getting hot reloaded
  triggers = [];

  // Look through the list of possible loadable config files and try loading
  // them in turn until a valid one is found.
  configurations.some(configuration => {
    triggerConfigJson = helpers.readSettings<ITriggerConfigJson>(
      "Triggers",
      configuration.baseFilePath,
      configuration.secretsFilePath,
    );

    if (!triggerConfigJson) {
      return false;
    }

    loadedConfiguration = configuration;
    return true;
  });

  // At this point there were no loadable files so bail.
  if (!triggerConfigJson) {
    throw Error(
      "Unable to find a trigger configuration file. Verify the trigger secret points to a file " +
        "called triggers.json or that the /config mount point contains a file called triggers.json.",
    );
  }

  log.info("Triggers", `Loaded configuration from ${loadedConfiguration.baseFilePath}`);

  triggers = triggerConfigJson.triggers.map(triggerJson => {
    log.info("Triggers", `Loaded configuration for ${triggerJson.name}`);
    const configuredTrigger = new Trigger({
      cooldownTime: triggerJson.cooldownTime,
      enabled: triggerJson.enabled ?? true, // If it isn't specified then enable the camera
      name: triggerJson.name,
      snapshotUri: triggerJson.snapshotUri,
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
    // Set up the masks as real objects
    configuredTrigger.activateRegions = triggerJson.activateRegions?.map(
      mask => new Rect(mask.xMinimum, mask.yMinimum, mask.xMaximum, mask.yMaximum),
    );

    // Set up the handlers
    if (triggerJson.handlers.mqtt) {
      configuredTrigger.mqttHandlerConfig = new MqttHandlerConfig(triggerJson.handlers.mqtt);
    }
    if (triggerJson.handlers.pushbullet) {
      configuredTrigger.pushbulletConfig = new PushbulletConfig(triggerJson.handlers.pushbullet);
    }
    if (triggerJson.handlers.pushover) {
      configuredTrigger.pushoverConfig = new PushoverConfig(triggerJson.handlers.pushover);
    }
    if (triggerJson.handlers.telegram) {
      configuredTrigger.telegramConfig = new TelegramConfig(triggerJson.handlers.telegram);
    }
    if (triggerJson.handlers.webRequest) {
      configuredTrigger.webRequestHandlerConfig = new WebRequestConfig(triggerJson.handlers.webRequest);
    }

    return configuredTrigger;
  });

  return loadedConfiguration;
}

/**
 * Explicitly activates a trigger by name where the image must first be retrieved from a web address.
 * @param triggerName The name of the trigger to activate
 */
export async function activateWebTrigger(triggerName: string): Promise<void> {
  // Find the trigger to activate. Do it case insensitive to avoid annoying
  // errors when the trigger name is capitalized slightly differently.
  const triggerToActivate = triggers.find(trigger => {
    return trigger.name.toLowerCase() === triggerName.toLowerCase();
  });

  if (!triggerToActivate) {
    log.verbose("Trigger manager", `No trigger found matching ${triggerName}`);
    return;
  }

  log.verbose("Trigger manager", `Activating ${triggerToActivate.name} based on a web request.`);

  const fileName = await triggerToActivate.downloadWebImage();

  // If no file name came back that means download failed for reason so just give up.
  if (!fileName) {
    return;
  }

  return triggerToActivate.processImage(fileName);
}

/**
 * Start all registered triggers watching for changes.
 */
export function startWatching(): void {
  triggers?.map(trigger => trigger.startWatching());
}

/**
 * Stops all registered triggers from watching for changes.
 */
export async function stopWatching(): Promise<void[]> {
  if (!triggers) {
    return;
  }

  return Promise.all(triggers.map(trigger => trigger.stopWatching()));
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

/**
 * Gets a trigger's statistics
 * @param triggerName The name of the trigger to get the statistics for
 * @returns The triggers new statistics
 */
export function getTriggerStatistics(triggerName: string): ITriggerStatistics {
  return triggers
    .find(trigger => {
      return trigger.name.toLowerCase() === triggerName.toLowerCase();
    })
    ?.getStatistics();
}

/**
 * Resets a trigger's statistics
 * @param triggerName The name of the trigger to reset the statistics for
 * @returns The trigger's new statistics
 */
export function resetTriggerStatistics(triggerName: string): ITriggerStatistics {
  const trigger = triggers.find(trigger => {
    return trigger.name.toLowerCase() === triggerName.toLowerCase();
  });

  if (!trigger) {
    return;
  }

  trigger.resetStatistics();

  return trigger.getStatistics();
}

/**
 * Returns the overall statistics
 */
export function getAllTriggerStatistics(): ITriggerStatistics[] {
  if (!triggers) {
    return;
  }

  return triggers.map(trigger => {
    return trigger.getStatistics();
  });
}

/**
 * Resets the statistics on every registered trigger.
 * @returns The new trigger statistics
 */
export function resetAllTriggerStatistics(): ITriggerStatistics[] {
  if (!triggers) {
    return;
  }

  return triggers.map(trigger => {
    return trigger.resetStatistics();
  });
}

/**
 * Gets the overall statistics for the system.
 * @returns The overall statistics for the system.
 */
export function getOverallStatistics(): ITriggerStatistics {
  return {
    analyzedFilesCount,
    triggeredCount,
  };
}

/**
 * Resets the overall statistics, publishing the updated MQTT message if necessary.
 * @returns The new overall statistics
 */
export function resetOverallStatistics(): ITriggerStatistics {
  analyzedFilesCount = 0;
  triggeredCount = 0;

  MQTTManager.publishStatisticsMessage(triggeredCount, analyzedFilesCount);
  return getOverallStatistics();
}

/**
 * Checks the watch folder on each trigger to see if there are images in it. If
 * not throws a warning.
 * @returns True if all the watch locations are valid, false otherwise.
 */
export function verifyTriggerWatchLocations(): boolean {
  const invalidWatchLocations = triggers?.filter(trigger => {
    const watchFolder = path.dirname(trigger.watchPattern);

    let files: string[];

    try {
      files = fs.readdirSync(watchFolder);
    } catch (e) {
      log.verbose(
        "Trigger manager",
        `Unable to read contents of watch folder ${watchFolder} for trigger ${trigger.name}. Check and make sure the image folder is mounted properly. ${e}`,
      );
      return true;
    }

    log.verbose("Trigger manager", `There are ${files.length} images waiting in ${watchFolder} for ${trigger.name}.`);
    return false;
  });

  // If no invalid watch locations were found then we're good to go and return true
  return invalidWatchLocations.length == 0;
}
