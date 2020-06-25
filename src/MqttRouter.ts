/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as log from "./Log";
import * as MqttManager from "./handlers/mqttManager/MqttManager";
import * as TriggerManager from "./TriggerManager";

const statusResetTopic = "node-deepstack-ai/statistics/reset";
const triggerResetTopic = "node-deepstack-ai/statistics/trigger/reset";

export async function initialize(): Promise<void> {
  const client = MqttManager.client;

  if (!MqttManager.isEnabled) {
    return;
  }

  // Register for overall statistic reset
  try {
    log.info("Mqtt router", `Subscribing to ${statusResetTopic}.`);
    await client.subscribe(statusResetTopic);

    log.info("Mqtt router", `Subscribing to ${triggerResetTopic}.`);
    await client.subscribe(triggerResetTopic);

    client.on("message", (topic, message) => processReceivedMessage(topic, message));
  } catch (e) {
    log.warn("Mqtt router", `Unable to subscribe to topics: ${e}`);
  }
}

/**
 * Takes a topic and a message and maps it to the right action
 * @param topic The topic received
 * @param message The message received
 */
function processReceivedMessage(topic: string, message: Buffer): void {
  log.info("Mqtt router", `Received message: ${statusResetTopic}`);

  if (topic === statusResetTopic) {
    log.verbose("Mqtt router", `Received overall statistics reset request.`);
    TriggerManager.resetOverallStatistics();
  }

  if (topic === triggerResetTopic) {
    log.verbose("Mqtt router", `Received trigger statistics reset request.`);
    let triggerName: string;

    try {
      triggerName = JSON.parse(message.toString())?.name;
    } catch (e) {
      log.warn("Mqtt router", `Unable to process incoming message: ${e}`);
      return;
    }

    if (!triggerName) {
      log.warn("Mqtt router", `Received a statistics reset request but no trigger name was provided`);
    }

    TriggerManager.resetTriggerStatistics(triggerName);
  }
}