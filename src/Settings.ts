/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as helpers from "./helpers";
import * as log from "./Log";

import IMqttManagerConfigJson from "./handlers/mqttManager/IMqttManagerConfigJson";
import IPushbulletManagerConfigJson from "./handlers/pushbulletManager/IPushbulletManagerConfigJson";
import IPushoverManagerConfigJson from "./handlers/pushoverManager/IPushoverManagerConfigJson";
import ISettingsConfigJson from "./types/ISettingsConfigJson";
import ITelegramManagerConfigJson from "./handlers/telegramManager/ITelegramManagerConfigJson";

export let awaitWriteFinish: boolean;
export let deepstackUri: string;
export let enableAnnotations: boolean;
export let enableWebServer: boolean;
export let mqtt: IMqttManagerConfigJson;
export let port: number;
export let processExistingImages: boolean;
export let purgeAge: number;
export let purgeInterval: number;
export let pushbullet: IPushbulletManagerConfigJson;
export let pushover: IPushoverManagerConfigJson;
export let telegram: ITelegramManagerConfigJson;
export let verbose: boolean;

/**
 * Takes a path to a configuration file and loads all of the triggers from it.
 * @param configFilePath The path to the configuration file
 * @returns The path to the loaded configuration file
 */
export function loadConfiguration(configFilePaths: string[]): string {
  let settingsConfigJson: ISettingsConfigJson;
  let loadedSettingsFilePath: string;

  // Look through the list of possible loadable config files and try loading
  // them in turn until a valid one is found.
  configFilePaths.some(configFilePath => {
    settingsConfigJson = helpers.readSettings<ISettingsConfigJson>("Settings", configFilePath);

    if (!settingsConfigJson) {
      return false;
    }

    loadedSettingsFilePath = configFilePath;
    return true;
  });

  // At this point there were no loadable files so bail.
  if (!settingsConfigJson) {
    throw Error("Unable to find any settings file.");
  }

  awaitWriteFinish = settingsConfigJson.awaitWriteFinish ?? false;
  deepstackUri = settingsConfigJson.deepstackUri;
  enableAnnotations = settingsConfigJson.enableAnnotations ?? false;
  // For backwards compatibility reasons enableWebServer is automatically true
  // when enableAnnotations is true.
  enableWebServer = enableAnnotations ? true : settingsConfigJson.enableWebServer ?? false;
  mqtt = settingsConfigJson.mqtt;
  port = settingsConfigJson.port ?? 4242;
  processExistingImages = settingsConfigJson.processExistingImages ?? false;
  purgeAge = settingsConfigJson.purgeAge ?? 30;
  purgeInterval = settingsConfigJson.purgeInterval ?? 60;
  pushover = settingsConfigJson.pushover;
  telegram = settingsConfigJson.telegram;
  verbose = settingsConfigJson.verbose ?? false;

  log.info("Settings", `Loaded settings from ${loadedSettingsFilePath}`);

  return loadedSettingsFilePath;
}
