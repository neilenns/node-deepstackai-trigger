/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// See https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#file-options-metadata
process.env.NTBA_FIX_350 = "true";

import * as fs from "fs";
import * as JSONC from "jsonc-parser";
import * as LocalStorageManager from "../../LocalStorageManager";
import * as log from "../../Log";
import * as mustacheFormatter from "../../MustacheFormatter";
import TelegramBot from "node-telegram-bot-api";
import { promises as fsPromise } from "fs";
import telegramManagerConfigurationSchema from "../../schemas/telegramManagerConfiguration.schema.json";
import validateJsonAgainstSchema from "../../schemaValidator";
import Trigger from "../../Trigger";
import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import ITelegramManagerConfigJson from "./ITelegramManagerConfigJson";

let isEnabled = false;
let telegramBot: TelegramBot;
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
      "Telegram Manager",
      "Unable to find an Telegram configuration file. If Telegram was disabled in the Docker configuration " +
        "then this warning can be safely ignored. Otherwise it means something is wrong with how the " +
        "container is configured. Verify the telegram secret points to a file called telegram.json or " +
        "that the /config mount point contains a file called telegram.json.",
    );
    return;
  }

  const telegramConfigJson = parseConfigFile(rawConfig);

  if (!(await validateJsonAgainstSchema(telegramManagerConfigurationSchema, telegramConfigJson))) {
    // This throws an error instead of allowing startup to proceed since the assumption is
    // if the user specified a configuration file they actually do want Telegram enabled
    // and running. It would be bad if this continued to run with Telegram disabled
    // and the user thought Telegram events were getting sent when they weren't.
    throw new Error("[Telegram Manager] Invalid configuration file.");
  }

  log.info("Telegram manager", `Loaded configuration from ${loadedConfigFilePath}`);

  telegramBot = new TelegramBot(telegramConfigJson.botToken, {
    filepath: false,
  });

  isEnabled = true;
}

export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  predictions: IDeepStackPrediction[],
): Promise<TelegramBot.Message[]> {
  if (!isEnabled) {
    return [];
  }

  // It's possible to not set up an Telegram handler on a trigger or to disable it, so don't
  // process if that's the case.
  if (!trigger?.telegramConfig?.enabled) {
    return [];
  }

  // Don't send if within the cooldown time
  if (!passesCooldownTime(fileName, trigger)) {
    return [];
  }

  // Save the trigger's last fire time
  cooldowns.set(trigger, new Date());

  // Do mustache variable replacement if a custom caption was provided.
  const caption = trigger.telegramConfig.caption
    ? mustacheFormatter.format(trigger.telegramConfig.caption, fileName, trigger, predictions)
    : trigger.name;

  // Figure out the path to the file to send based on whether
  // annotated images were requested in the config.
  const imageFileName =
    trigger.telegramConfig.annotateImage && !process.env.DISABLE_ANNOTATIONS
      ? LocalStorageManager.mapToLocalStorage(fileName)
      : fileName;

  // Send all the messages
  try {
    return Promise.all(
      trigger.telegramConfig.chatIds.map(chatId => sendTelegramMessage(caption, imageFileName, chatId)),
    );
  } catch (e) {
    log.warn("Telegram manager", `Unable to send message: ${e.error}`);
    return [];
  }
}

async function sendTelegramMessage(
  triggerName: string,
  fileName: string,
  chatId: number,
): Promise<TelegramBot.Message> {
  log.info("Telegram manager", `Sending message to ${chatId}`);

  const imageBuffer = await fsPromise.readFile(fileName).catch(e => {
    log.warn("Telegram manager", `Unable to load file: ${e.message}`);
    return undefined;
  });

  const message = telegramBot
    .sendPhoto(chatId, imageBuffer, {
      caption: triggerName,
    })
    .catch(e => {
      log.warn("Telegram manager", `Unable to send message: ${e.message}`);
      return undefined;
    });

  return message;
}

/**
 * Checks to see if a trigger fired within the cooldown window
 * specified for the Telegram handler.
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

  if (secondsSinceLastTrigger < trigger.telegramConfig.cooldownTime) {
    log.info(
      `Telegram manager`,
      `${fileName}: Skipping sending message as the cooldown period of ${trigger.telegramConfig.cooldownTime} seconds hasn't expired.`,
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
      "Telegram Manager",
      `No configuration file was specified so Telegram events won't be sent. To enable Telegram events make sure the telegram secret in the docker-compose.yaml points to a configuration file.`,
    );
    return null;
  }

  let rawConfig: string;
  try {
    rawConfig = fs.readFileSync(configFilePath, "utf-8");
  } catch (e) {
    log.warn("Telegram Manager", `Unable to read the Telegram configuration file: ${e.message}.`);
    return null;
  }

  return rawConfig;
}

/**
 * Takes a raw JSON string and converts it to an ITelegramManagerConfigJson
 * @param rawConfig The raw JSON in a string
 * @returns An ITelegramManagerConfigJson from the parsed JSON
 */
function parseConfigFile(rawConfig: string): ITelegramManagerConfigJson {
  let parseErrors: JSONC.ParseError[];

  const telegramConfigJson = JSONC.parse(rawConfig, parseErrors) as ITelegramManagerConfigJson;

  // This extra level of validation really shouldn't be necessary since the
  // file passed schema validation. Still, better safe than crashing.
  if (parseErrors && parseErrors.length > 0) {
    throw new Error(
      `[Telegram Manager] Unable to load configuration file: ${parseErrors
        .map(error => log.error("Telegram manager", `${error?.error}`))
        .join("\n")}`,
    );
  }

  return telegramConfigJson;
}
