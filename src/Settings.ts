/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IMqttManagerConfigJson from "./handlers/mqttManager/IMqttManagerConfigJson";
import ITelegramManagerConfigJson from "./handlers/telegramManager/ITelegramManagerConfigJson";
import IPushoverManagerConfigJson from "./handlers/pushoverManager/IPushoverManagerConfigJson";
import * as log from "./Log";
import validateJsonAgainstSchema from "./schemaValidator";
import settingsSchema from "./schemas/settings.schema.json";
import * as fs from "fs";
import * as JSONC from "jsonc-parser";
import ISettingsConfigJson from "./types/ISettingsConfigJson";

export let awaitWriteFinish: boolean;
export let deepstackUri: string;
export let enableAnnotations: boolean;
export let mqtt: IMqttManagerConfigJson;
export let port: number;
export let processExistingImages: boolean;
export let purgeAge: number;
export let purgeInterval: number;
export let pushover: IPushoverManagerConfigJson;
export let telegram: ITelegramManagerConfigJson;

/**
 * Takes a path to a configuration file and loads all of the triggers from it.
 * @param configFilePath The path to the configuration file
 */
export async function loadConfiguration(configFilePaths: string[]): Promise<void> {
  let rawConfig: string;
  let loadedSettingsFilePath: string;

  // Look through the list of possible loadable config files and try loading
  // them in turn until a valid one is found.
  const foundLoadableFile = configFilePaths.some(configFilePath => {
    rawConfig = readRawConfigFile(configFilePath);

    if (!rawConfig) {
      return false;
    }

    loadedSettingsFilePath = configFilePath;

    return true;
  });

  // At this point there were no loadable files so bail.
  if (!foundLoadableFile) {
    log.warn("Settings", "Unable to find any settings file. Next step would be falling back.");
    return;
  }

  const settingsConfigJson = parseConfigFile<ISettingsConfigJson>(rawConfig);

  if (!(await validateJsonAgainstSchema(settingsSchema, settingsConfigJson))) {
    throw new Error("[Settings] Invalid configuration file.");
  }

  awaitWriteFinish = settingsConfigJson.awaitWriteFinish ?? false;
  deepstackUri = settingsConfigJson.deepstackUri;
  enableAnnotations = settingsConfigJson.enableAnnotations ?? false;
  mqtt = settingsConfigJson.mqtt;
  port = settingsConfigJson.port ?? 4242;
  processExistingImages = settingsConfigJson.processExistingImages ?? false;
  purgeAge = settingsConfigJson.purgeAge ?? 30;
  purgeInterval = settingsConfigJson.purgeInterval ?? 60;
  pushover = settingsConfigJson.pushover;
  telegram = settingsConfigJson.telegram;

  log.info("Settings", `Loaded settings from ${loadedSettingsFilePath}`);
}

/**
 * Loads a trigger configuration file
 * @param configFilePath The path to the configuration file
 * @returns The raw JSON without validation
 */
function readRawConfigFile(configFilePath: string): string {
  if (!configFilePath) {
    log.info("Settings", `No settings file was specified.`);
    return null;
  }

  let rawConfig: string;
  try {
    rawConfig = fs.readFileSync(configFilePath, "utf-8");
  } catch (e) {
    log.warn("Settings", `Unable to read the settings file: ${e.message}.`);
    return null;
  }

  return rawConfig;
}

/**
 * Takes a raw JSON string and converts it to an ITelegramManagerConfigJson
 * @param rawConfig The raw JSON in a string
 * @returns An ITelegramManagerConfigJson from the parsed JSON
 */
function parseConfigFile<T>(rawConfig: string): T {
  let parseErrors: JSONC.ParseError[];

  const configJson = JSONC.parse(rawConfig, parseErrors) as T;

  // This extra level of validation really shouldn't be necessary since the
  // file passed schema validation. Still, better safe than crashing.
  if (parseErrors && parseErrors.length > 0) {
    throw new Error(
      `[Settings] Unable to load configuration file: ${parseErrors
        .map(error => log.error("Settings", `${error?.error}`))
        .join("\n")}`,
    );
  }

  return configJson;
}
