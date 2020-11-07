/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as LocalStorageManager from "../../LocalStorageManager";
import * as log from "../../Log";
import * as mustacheFormatter from "../../MustacheFormatter";
import * as Settings from "../../Settings";

import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import PushoverClient from "../../pushoverClient/PushoverClient";
import PushoverMessage from "../../pushoverClient/PushoverMessage";
import Trigger from "../../Trigger";

let _isEnabled = false;
let _pushClient: PushoverClient;

// Tracks the last time each trigger fired, for use when calculating cooldown time windows
const _cooldowns = new Map<Trigger, Date>();

export async function initialize(): Promise<void> {
  if (!Settings.pushover) {
    log.info("Pushover", "No Pushover settings specified. Pushover is disabled.");
    return;
  }

  // The enabled setting is true by default
  _isEnabled = Settings.pushover.enabled ?? true;

  if (!_isEnabled) {
    log.verbose("Pushover", "Pushover is disabled via settings.");
    return;
  }

  _pushClient = new PushoverClient({
    apiKey: Settings.pushover.apiKey,
    userKey: Settings.pushover.userKey,
  });

  log.info("Pushover", `Pushover enabled.`);
}

export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  predictions: IDeepStackPrediction[],
): Promise<void[]> {
  if (!_isEnabled) {
    return;
  }

  // It's possible to not set up a Pushover handler on a trigger or to disable it, so don't
  // process if that's the case.
  if (!trigger?.pushoverConfig?.enabled) {
    return;
  }

  // Don't send if within the cooldown time.
  if (!passesCooldownTime(fileName, trigger)) {
    return;
  }

  // Save the trigger's last fire time.
  _cooldowns.set(trigger, new Date());

  // Do mustache variable replacement if a custom caption was provided.
  const caption = trigger.pushoverConfig.caption
    ? mustacheFormatter.format(trigger.pushoverConfig.caption, fileName, trigger, predictions)
    : trigger.name;

  // Throw a warning if annotations was requested but it wasn't enabled in settings
  if (trigger.pushoverConfig.annotateImage && !Settings.enableAnnotations) {
    log.warn(
      "Pushover",
      `annotateImage is enabled on the trigger however enableAnnotations isn't true in settings.json. Make sure enableAnnotations is set to true to use annotated images.`,
    );
  }

  // Figure out the path to the file to send based on whether
  // annotated images were requested in the config.
  const imageFileName =
    trigger.pushoverConfig.annotateImage && Settings.enableAnnotations
      ? LocalStorageManager.mapToLocalStorage(LocalStorageManager.Locations.Annotations, fileName)
      : fileName;

  // Build the pushover message options.
  const pushoverMessage = new PushoverMessage({
    imageFileName: imageFileName,
    message: caption,
    sound: trigger.pushoverConfig.sound,
  });

  // Send all the messages.
  try {
    return Promise.all(
      trigger.pushoverConfig.userKeys.map(user => {
        pushoverMessage.userKey = user;
        sendPushoverMessage(pushoverMessage);
      }),
    );
  } catch (e) {
    log.error("Pushover", `Unable to send message: ${e.error}`);
    return;
  }
}

async function sendPushoverMessage(message: PushoverMessage): Promise<void> {
  log.verbose("Pushover", `Sending message to ${message.userKey}`);

  return await _pushClient.send(message);
}

/**
 * Checks to see if a trigger fired within the cooldown window
 * specified for the Pushover handler.
 * @param fileName The filename of the image that fired the trigger
 * @param trigger The trigger
 * @returns true if the trigger happened outside of the cooldown window
 */
function passesCooldownTime(fileName: string, trigger: Trigger): boolean {
  const lastTriggerTime = _cooldowns.get(trigger);

  // If this was never triggered then no cooldown applies.
  if (!lastTriggerTime) {
    return true;
  }

  // getTime() returns milliseconds so divide by 1000 to get seconds
  const secondsSinceLastTrigger = (trigger.receivedDate.getTime() - lastTriggerTime.getTime()) / 1000;

  if (secondsSinceLastTrigger < trigger.pushoverConfig.cooldownTime) {
    log.verbose(
      `Pushover`,
      `${fileName}: Skipping sending message as the cooldown period of ${trigger.pushoverConfig.cooldownTime} seconds hasn't expired.`,
    );
    return false;
  }

  return true;
}
