/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// See https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#file-options-metadata
process.env.NTBA_FIX_350 = "true";

import * as LocalStorageManager from "../../LocalStorageManager";
import * as log from "../../Log";
import * as mustacheFormatter from "../../MustacheFormatter";
import * as Settings from "../../Settings";

import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import { promises as fsPromise } from "fs";
import TelegramBot from "node-telegram-bot-api";
import Trigger from "../../Trigger";

let isEnabled = false;
let telegramBot: TelegramBot;

// Tracks the last time each trigger fired, for use when calculating cooldown time windows
const cooldowns = new Map<Trigger, Date>();

export async function initialize(): Promise<void> {
  if (!Settings.telegram) {
    log.info("Telegram", "No Telegram settings specified. Telegram is disabled.");
    return;
  }

  // The enabled setting is true by default
  isEnabled = Settings.telegram.enabled ?? true;

  if (!isEnabled) {
    log.info("Telegram", "Telegram is disabled via settings.");
    return;
  }

  telegramBot = new TelegramBot(Settings.telegram.botToken, {
    filepath: false,
  });

  log.info("Telegram", "Telegram enabled.");
}

export async function processTrigger(
  fileName: string,
  trigger: Trigger,
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
    trigger.telegramConfig.annotateImage && Settings.enableAnnotations
      ? LocalStorageManager.mapToLocalStorage(fileName)
      : fileName;

  // Send all the messages
  try {
    return Promise.all(
      trigger.telegramConfig.chatIds.map(chatId => sendTelegramMessage(caption, imageFileName, chatId)),
    );
  } catch (e) {
    log.warn("Telegram", `Unable to send message: ${e.error}`);
    return [];
  }
}

async function sendTelegramMessage(
  triggerName: string,
  fileName: string,
  chatId: number,
): Promise<TelegramBot.Message> {
  log.info("Telegram", `Sending message to ${chatId}`);

  const imageBuffer = await fsPromise.readFile(fileName).catch(e => {
    log.warn("Telegram", `Unable to load file: ${e.message}`);
    return undefined;
  });

  const message = telegramBot
    .sendPhoto(chatId, imageBuffer, {
      caption: triggerName,
    })
    .catch(e => {
      log.warn("Telegram", `Unable to send message: ${e.message}`);
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
      `Telegram`,
      `${fileName}: Skipping sending message as the cooldown period of ${trigger.telegramConfig.cooldownTime} seconds hasn't expired.`,
    );
    return false;
  }

  return true;
}
