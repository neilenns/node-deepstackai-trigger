/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { promises as fsPromise } from 'fs';
import * as JSONC from 'jsonc-parser';
import TelegramBot from 'node-telegram-bot-api';

import * as log from '../../Log';
import telegramManagerConfigurationSchema from '../../schemas/telegramManagerConfiguration.schema.json';
import validateJsonAgainstSchema from '../../schemaValidator';
import Trigger from '../../Trigger';
import IDeepStackPrediction from '../../types/IDeepStackPrediction';
import ITelegramManagerConfigJson from './ITelegramManagerConfigJson';

let isEnabled = false;
let telegramBot: TelegramBot;

/**
 * Takes a path to a configuration file and loads all of the triggers from it.
 * @param configFilePath The path to the configuration file
 */
export async function loadConfiguration(configFilePath: string): Promise<void> {
  const rawConfig = await readRawConfigFile(configFilePath);

  if (!rawConfig) {
    return;
  }

  const telegramConfigJson = parseConfigFile(rawConfig);

  if (!(await validateJsonAgainstSchema(telegramManagerConfigurationSchema, telegramConfigJson))) {
    // This throws an error instead of allowing startup to proceed since the assumption is
    // if the user specified a configuration file they actually do want MQTT enabled
    // and running. It would be bad if this continued to run with MQTT disabled
    // and the user thought MQTT events were getting sent when they weren't.
    throw new Error("[Telegram Manager] Invalid configuration file.");
  }

  log.info("Telegram manager", `Loaded configuration from ${configFilePath}`);

  // See https://github.com/yagop/node-telegram-bot-api/issues/319
  process.env.NTBA_FIX_319 = "true";
  telegramBot = new TelegramBot(telegramConfigJson.botToken);

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

  // It's possible to not set up an mqtt handler on a trigger or to disable it, so don't
  // process if that's the case.
  if (!trigger?.telegramConfig?.enabled) {
    return [];
  }

  log.info("Telegram Manager", `${fileName}: Publishing event to ${trigger.mqttConfig.topic}`);

  const messagePromises = trigger.telegramConfig.chatIds.map(chatId =>
    sendTelegramMessage(trigger.name, fileName, chatId),
  );

  return Promise.all(messagePromises);
}

async function sendTelegramMessage(name: string, fileName: string, chatId: number): Promise<TelegramBot.Message> {
  log.info("Telegram manager", `Sending message to ${chatId}`);
  return telegramBot.sendPhoto(chatId, fileName);
}

/**
 * Loads a trigger configuration file
 * @param configFilePath The path to the configuration file
 * @returns The unvalidated raw JSON
 */
async function readRawConfigFile(configFilePath: string): Promise<string> {
  if (!configFilePath) {
    log.info(
      "Telegram Manager",
      `No configuration file was specified so Telegram events won't be sent. To enable Telegram events make sure the telegram secret in the docker-compose.yaml points to a configuration file.`,
    );
    return null;
  }

  let rawConfig: string;
  try {
    rawConfig = await fsPromise.readFile(configFilePath, "utf-8");
  } catch (e) {
    log.warn(
      "Telegram Manager",
      `Unable to read the Telegram configuration file: ${e.message}. If Telegram was disabled in the Docker configuration then this warning can be safely ignored. Otherwise it means something is wrong in the secrets file mapping in the Docker configuration.`,
    );
    return null;
  }

  // This shouldn't happen. Keeping the check here in case it does in the real world
  // and someone reports things not working.
  if (!rawConfig) {
    throw new Error(`[Telegram Manager] Unable to load configuration file ${configFilePath}.`);
  }

  return rawConfig;
}

/**
 * Takes a raw JSON string and converts it to an ITelegramManagerConfigJson
 * @param rawConfig The raw JSON in a string
 * @returns An IMqttManagerConfigJson from the parsed JSON
 */
function parseConfigFile(rawConfig: string): ITelegramManagerConfigJson {
  let parseErrors: JSONC.ParseError[];

  const telegramConfigJson = JSONC.parse(rawConfig, parseErrors) as ITelegramManagerConfigJson;

  // This extra level of validation really shouldn't be necessary since the
  // file passed schema validation. Still, better safe than crashy.
  if (parseErrors && parseErrors.length > 0) {
    throw new Error(
      `[Telegram Manager] Unable to load configuration file: ${parseErrors
        .map(error => log.error("Telegram manager", `${error?.error}`))
        .join("\n")}`,
    );
  }

  return telegramConfigJson;
}
