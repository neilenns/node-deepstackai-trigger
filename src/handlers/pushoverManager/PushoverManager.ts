/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as JSONC from "jsonc-parser";
import * as log from "../../Log";
import * as LocalStorageManager from "../../LocalStorageManager";
import * as mustacheFormatter from "../../MustacheFormatter";
import * as AnnotationManager from "../annotationManager/AnnotationManager";
import validateJsonAgainstSchema from "../../schemaValidator";
import Trigger from "../../Trigger";
import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import IPushoverManagerConfigJson from "./IPushoverManagerConfigJson";
import pushoverManagerConfigurationSchema from "../../schemas/pushoverManagerConfiguration.schema.json";
import PushoverClient from "../../pushoverClient/PushoverClient";

let isEnabled = false;
// So ugly
let pushClient: PushoverClient;

// Tracks the last time each trigger fired, for use when calculating cooldown time windows
const cooldowns = new Map<Trigger, Date>();

/**
 * Takes a path to a configuration file and loads all of the triggers from it.
 * @param configFilePath The path to the configuration file
 */
export async function loadConfiguration(configFilePaths: string[]): Promise<void> {
  let rawConfig: string;
  let loadedConfigFilePath: string;

  // Look through the list of possible loadable config files and try loading
  // them in turn until a valid one is found.
  const foundLoadableFile = configFilePaths.some(configFilePath => {
    rawConfig = readRawConfigFile(configFilePath);
    loadedConfigFilePath = configFilePath;

    if (!rawConfig) {
      return false;
    }

    return true;
  });

  // At this point there were no loadable files so bail.
  if (!foundLoadableFile) {
    log.warn(
      "Pushover manager",
      "Unable to find a Pushover configuration file. If Pushover was disabled in the Docker configuration " +
        "then this warning can be safely ignored. Otherwise it means something is wrong with how the " +
        "container is configured. Verify the pushover secret points to a file called pushover.json or " +
        "that the /config mount point contains a file called pushover.json.",
    );
    return;
  }

  const pushoverConfigJson = parseConfigFile(rawConfig);

  if (!(await validateJsonAgainstSchema(pushoverManagerConfigurationSchema, pushoverConfigJson))) {
    // This throws an error instead of allowing startup to proceed since the assumption is
    // if the user specified a configuration file they actually do want Pushover enabled
    // and running. It would be bad if this continued to run with Pushover disabled
    // and the user thought Pushover events were getting sent when they weren't.
    throw new Error("[Pushover Manager] Invalid configuration file.");
  }

  pushClient = new PushoverClient({
    apiKey: pushoverConfigJson.apiKey,
    userKey: pushoverConfigJson.userKey,
  });

  log.info("Pushover manager", `Loaded configuration from ${loadedConfigFilePath}`);

  isEnabled = true;
}

export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  predictions: IDeepStackPrediction[],
): Promise<void[]> {
  if (!isEnabled) {
    return;
  }

  // It's possible to not set up a Pushover handler on a trigger or to disable it, so don't
  // process if that's the case.
  if (!trigger?.pushoverConfig?.enabled) {
    return;
  }

  // Don't send if within the cooldown time
  if (!passesCooldownTime(fileName, trigger)) {
    return;
  }

  // Save the trigger's last fire time
  cooldowns.set(trigger, new Date());

  // Do mustache variable replacement if a custom caption was provided.
  const caption = trigger.pushoverConfig.caption
    ? mustacheFormatter.format(trigger.pushoverConfig.caption, fileName, trigger, predictions)
    : trigger.name;

  // Figure out the path to the file to send based on whether
  // annotated images were requested in the config.
  const imageFileName =
    trigger.pushoverConfig.annotateImage && AnnotationManager.enabled
      ? LocalStorageManager.mapToLocalStorage(fileName)
      : fileName;

  // Send all the messages
  try {
    return Promise.all(trigger.pushoverConfig.userKeys.map(user => sendPushoverMessage(caption, imageFileName, user)));
  } catch (e) {
    log.warn("Pushover manager", `Unable to send message: ${e.error}`);
    return;
  }
}

async function sendPushoverMessage(caption: string, fileName: string, user: string): Promise<void> {
  log.info("Pushover manager", `Sending message to ${user}`);

  return await pushClient.send({
    userKey: user,
    message: caption,
    imageFileName: fileName,
  });
}

/**
 * Checks to see if a trigger fired within the cooldown window
 * specified for the Pushover handler.
 * @param fileName The filename of the image that fired the trigger
 * @param trigger The trigger
 * @returns true if the trigger happened outside of the cooldown window
 */
function passesCooldownTime(fileName: string, trigger: Trigger): boolean {
  const lastTriggerTime = cooldowns.get(trigger);

  // If this was never triggered then no cooldown applies.
  if (!lastTriggerTime) {
    return true;
  }

  // getTime() returns milliseconds so divide by 1000 to get seconds
  const secondsSinceLastTrigger = (trigger.receivedDate.getTime() - lastTriggerTime.getTime()) / 1000;

  if (secondsSinceLastTrigger < trigger.pushoverConfig.cooldownTime) {
    log.info(
      `Pushover manager`,
      `${fileName}: Skipping sending message as the cooldown period of ${trigger.pushoverConfig.cooldownTime} seconds hasn't expired.`,
    );
    return false;
  }

  return true;
}
/**
 * Loads a trigger configuration file
 * @param configFilePath The path to the configuration file
 * @returns The raw JSON without validation
 */
function readRawConfigFile(configFilePath: string): string {
  if (!configFilePath) {
    log.info(
      "Pushover manager",
      `No configuration file was specified so Pushover events won't be sent. To enable Pushover events make sure the pushover secret in the docker-compose.yaml points to a configuration file.`,
    );
    return null;
  }

  let rawConfig: string;
  try {
    rawConfig = fs.readFileSync(configFilePath, "utf-8");
  } catch (e) {
    log.warn("Pushover manager", `Unable to read the Pushover configuration file: ${e.message}.`);
    return null;
  }

  return rawConfig;
}

/**
 * Takes a raw JSON string and converts it to an IPushoverManagerConfigJson
 * @param rawConfig The raw JSON in a string
 * @returns An IPushoverManagerConfigJson from the parsed JSON
 */
function parseConfigFile(rawConfig: string): IPushoverManagerConfigJson {
  let parseErrors: JSONC.ParseError[];

  const pushoverConfigJson = JSONC.parse(rawConfig, parseErrors) as IPushoverManagerConfigJson;

  // This extra level of validation really shouldn't be necessary since the
  // file passed schema validation. Still, better safe than crashing.
  if (parseErrors && parseErrors.length > 0) {
    throw new Error(
      `[Pushover manager] Unable to load configuration file: ${parseErrors
        .map(error => log.error("Pushover manager", `${error?.error}`))
        .join("\n")}`,
    );
  }

  return pushoverConfigJson;
}
