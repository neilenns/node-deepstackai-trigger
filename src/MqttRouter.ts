/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as log from "./Log";
import * as MqttManager from "./handlers/mqttManager/MqttManager";
import * as TriggerManager from "./TriggerManager";

const _statusResetTopic = "node-deepstackai-trigger/statistics/reset";
const _triggerResetTopic = "node-deepstackai-trigger/statistics/trigger/reset";
const _triggerMotionTopic = "node-deepstackai-trigger/motion";

export async function initialize(): Promise<void> {
  if (!MqttManager.isEnabled) {
    return;
  }

  const client = MqttManager.client;

  try {
    log.verbose("Mqtt router", `Subscribing to ${_statusResetTopic}.`);
    await client.subscribe(_statusResetTopic);

    log.verbose("Mqtt router", `Subscribing to ${_triggerResetTopic}.`);
    await client.subscribe(_triggerResetTopic);

    log.verbose("Mqtt router", `Subscribing to ${_triggerMotionTopic}.`);
    await client.subscribe(_triggerMotionTopic);

    client.on("message", (topic, message) => processReceivedMessage(topic, message));
  } catch (e) {
    log.error("Mqtt router", `Unable to subscribe to topics: ${e}`);
  }
}

/**
 * Takes a topic and a message and maps it to the right action
 * @param topic The topic received
 * @param message The message received
 */
function processReceivedMessage(topic: string, message: Buffer): void {
  log.verbose("Mqtt router", `Received message: ${_statusResetTopic}`);

  if (topic === _statusResetTopic) {
    log.verbose("Mqtt router", `Received overall statistics reset request.`);
    TriggerManager.resetOverallStatistics();
    return;
  }

  // All topics after this point must have a trigger name in the message
  let triggerName: string;
  try {
    triggerName = JSON.parse(message.toString())?.name;
  } catch (e) {
    log.error("Mqtt router", `Unable to process incoming message: ${e}`);
    return;
  }

  if (!triggerName) {
    log.verbose("Mqtt router", `Received a statistics reset request but no trigger name was provided`);
  }

  // Now that the name exists process the remaining topics
  if (topic === _triggerResetTopic) {
    log.verbose("Mqtt router", `Received trigger statistics reset request for ${triggerName}.`);

    TriggerManager.resetTriggerStatistics(triggerName);
    return;
  }

  if (topic === _triggerMotionTopic) {
    log.verbose("Mqtt router", `Received motion event for ${triggerName}.`);

    TriggerManager.activateWebTrigger(triggerName);
    return;
  }
}
