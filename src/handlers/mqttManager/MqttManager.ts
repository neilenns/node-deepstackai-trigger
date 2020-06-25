/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as log from "../../Log";
import * as mustacheFormatter from "../../MustacheFormatter";

import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import MQTT from "async-mqtt";
import { mqtt as settings } from "../../Settings";
import MqttMessageConfig from "./MqttMessageConfig";
import path from "path";
import Trigger from "../../Trigger";

let _isEnabled = false;
let _mqttClient: MQTT.AsyncClient;
let _retain = false;
let _statusTopic = "node-deepstackai-trigger/status";

const _timers = new Map<string, NodeJS.Timeout>();

/**
 * Initializes the MQTT using settings from the global Settings module.
 */
export async function initialize(): Promise<void> {
  if (!settings) {
    log.info("MQTT", "No MQTT settings specified. MQTT is disabled.");
    return;
  }

  // The enabled setting is true by default
  _isEnabled = settings.enabled ?? true;

  if (!_isEnabled) {
    log.info("MQTT", "MQTT is disabled via settings.");
    return;
  }

  if (settings.statusTopic) {
    _statusTopic = settings.statusTopic;
  }

  if (settings.retain) {
    _retain = settings.retain;
    log.info("MQTT", "Retain flag set in configuration. All messages will be published with retain turned on.");
  }

  _mqttClient = await MQTT.connectAsync(settings.uri, {
    username: settings.username,
    password: settings.password,
    clientId: "node-deepstackai-trigger",
    rejectUnauthorized: settings.rejectUnauthorized ?? true,
    will: {
      topic: _statusTopic,
      payload: JSON.stringify({ state: "offline" }),
      qos: 2,
      retain: _retain,
    },
  }).catch(e => {
    _isEnabled = false;
    throw new Error(`[MQTT] Unable to connect: ${e.message}`);
  });

  log.info("MQTT", `Connected to MQTT server ${settings.uri}`);
}

export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  predictions: IDeepStackPrediction[],
): Promise<MQTT.IPublishPacket[]> {
  if (!_isEnabled) {
    return [];
  }

  // It's possible to not set up an mqtt handler on a trigger or to disable it, so don't
  // process if that's the case.
  if (!trigger?.mqttHandlerConfig?.enabled) {
    return [];
  }

  // If for some reason we wound up with no messages configured do nothing.
  // This should never happen due to schema validation but better safe than crashing.
  if (!trigger?.mqttHandlerConfig?.messages) {
    return [];
  }

  return Promise.all(
    trigger.mqttHandlerConfig?.messages.map(message => {
      return publishDetectionMessage(fileName, trigger, message, predictions);
    }),
  );
}

async function publishDetectionMessage(
  fileName: string,
  trigger: Trigger,
  messageConfig: MqttMessageConfig,
  predictions: IDeepStackPrediction[],
): Promise<MQTT.IPublishPacket> {
  log.verbose("MQTT", `${fileName}: Publishing event to ${messageConfig.topic}`);

  // If an off delay is configured set up a timer to send the off message in the requested number of seconds
  if (messageConfig.offDelay) {
    const existingTimer = _timers.get(messageConfig.topic);

    // Cancel any timer that may still be running for the same topic
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set the new timer
    _timers.set(messageConfig.topic, setTimeout(publishOffEvent, messageConfig.offDelay * 1000, messageConfig.topic));
  }

  // Build the detection payload
  const detectionPayload = messageConfig.payload
    ? mustacheFormatter.format(messageConfig.payload, fileName, trigger, predictions)
    : JSON.stringify({
        fileName,
        name: trigger.name,
        analysisDurationMs: trigger.analysisDuration,
        basename: path.basename(fileName),
        predictions,
        formattedPredictions: mustacheFormatter.formatPredictions(predictions),
        formattedStatistics: mustacheFormatter.formatStatistics(trigger.triggeredCount, trigger.analyzedFilesCount),
        state: "on",
        analyzedFilesCount: trigger.analyzedFilesCount,
        triggerCount: trigger.triggeredCount,
      });

  return await _mqttClient.publish(messageConfig.topic, detectionPayload, { retain: _retain });
}

/**
 * Publishes statistics to MQTT
 * @param triggerCount Trigger count
 * @param analyzedFilesCount False positive count
 */
export async function publishStatisticsMessage(
  triggerCount: number,
  analyzedFilesCount: number,
): Promise<MQTT.IPublishPacket[]> {
  // Don't send anything if MQTT isn't enabled
  if (!_mqttClient) {
    return [];
  }

  return [
    await _mqttClient.publish(
      _statusTopic,
      JSON.stringify({
        // Ensures the status still reflects as up and running for people
        // that have an MQTT binary sensor in Home Assistant
        state: "online",
        triggerCount,
        analyzedFilesCount,
        formattedStatistics: mustacheFormatter.formatStatistics(triggerCount, analyzedFilesCount),
      }),
      { retain: _retain },
    ),
  ];
}

/**
 * Sends a simple message indicating the service is up and running
 */
export async function publishServerState(state: string, details?: string): Promise<MQTT.IPublishPacket> {
  // Don't do anything if the MQTT client wasn't configured
  if (!_mqttClient) {
    return;
  }

  return _mqttClient.publish(_statusTopic, JSON.stringify({ state, details }), { retain: _retain });
}

/**
 * Sends a message indicating the motion for a particular trigger has stopped
 * @param topic The topic to publish the message on
 */
async function publishOffEvent(topic: string): Promise<MQTT.IPublishPacket> {
  return await _mqttClient.publish(topic, JSON.stringify({ state: "off" }), { retain: _retain });
}
