/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import MQTT, { IPublishPacket } from 'async-mqtt';
import * as fs from 'fs';
import * as JSONC from 'jsonc-parser';
import path from 'path';

import * as log from '../../Log';
import * as mustacheFormatter from '../../MustacheFormatter';
import mqttManagerConfigurationSchema from '../../schemas/mqttManagerConfiguration.schema.json';
import validateJsonAgainstSchema from '../../schemaValidator';
import Trigger from '../../Trigger';
import IDeepStackPrediction from '../../types/IDeepStackPrediction';
import IMqttManagerConfigJson from './IMqttManagerConfigJson';

let isEnabled = false;
let statusTopic = "node-deepstackai-trigger/status";

let mqttClient: MQTT.AsyncClient;
const timers = new Map<string, NodeJS.Timeout>();

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
      "MQTT Manager",
      "Unable to find an MQTT configuration file. If MQTT was disabled in the Docker configuration " +
        "then this warning can be safely ignored. Otherwise it means something is wrong with how the " +
        "container is configured. Verify the mqtt secret points to a file called mqtt.json or " +
        "that the /config mount point contains a file called mqtt.json.",
    );
    return;
  }

  const mqttConfigJson = parseConfigFile(rawConfig);

  if (!(await validateJsonAgainstSchema(mqttManagerConfigurationSchema, mqttConfigJson))) {
    // This throws an error instead of allowing startup to proceed since the assumption is
    // if the user specified a configuration file they actually do want MQTT enabled
    // and running. It would be bad if this continued to run with MQTT disabled
    // and the user thought MQTT events were getting sent when they weren't.
    throw new Error("[MQTT Manager] Invalid configuration file.");
  }

  log.verbose("MQTT manager", `Loaded configuration from ${loadedConfigFilePath}`);

  if (mqttConfigJson.statusTopic) {
    statusTopic = mqttConfigJson.statusTopic;
  }

  if (mqttConfigJson.statusTopic) {
    statusTopic = mqttConfigJson.statusTopic;
  }

  mqttClient = await MQTT.connectAsync(mqttConfigJson.uri, {
    username: mqttConfigJson.username,
    password: mqttConfigJson.password,
    clientId: "node-deepstackai-trigger",
    rejectUnauthorized: mqttConfigJson.rejectUnauthorized ?? true,
    will: {
      topic: statusTopic,
      payload: "offline",
      qos: 2,
      retain: false,
    },
  }).catch(e => {
    throw new Error(`[MQTT Manager] Unable to connect: ${e.message}`);
  });

  log.info("MQTT Manager", `Connected to MQTT server ${mqttConfigJson.uri}`);
  isEnabled = true;
}

export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  predictions: IDeepStackPrediction[],
): Promise<MQTT.IPublishPacket[]> {
  if (!isEnabled) {
    return [];
  }

  // It's possible to not set up an mqtt handler on a trigger or to disable it, so don't
  // process if that's the case.
  if (!trigger?.mqttConfig?.enabled) {
    return [];
  }

  log.verbose("MQTT Manager", `${fileName}: Publishing event to ${trigger.mqttConfig.topic}`);

  // If an off delay is configured set up a timer to send the off message in the requested number of seconds
  if (trigger?.mqttConfig?.offDelay) {
    const existingTimer = timers.get(trigger.mqttConfig.topic);

    // Cancel any timer that may still be running for the same topic
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set the new timer
    timers.set(
      trigger.mqttConfig.topic,
      setTimeout(publishOffEvent, trigger.mqttConfig.offDelay * 1000, trigger.mqttConfig.topic),
    );
  }

  const payload = trigger.mqttConfig.payload
    ? mustacheFormatter.format(trigger.mqttConfig.payload, fileName, trigger, predictions)
    : JSON.stringify({
        fileName,
        basename: path.basename(fileName),
        predictions,
        state: "on",
      });

  // Even though this only calls one topic the way this gets used elsewhere
  // the expectation is it returns an array.
  return [await mqttClient.publish(trigger.mqttConfig.topic, payload)];
}

async function publishOffEvent(topic: string): Promise<IPublishPacket> {
  return await mqttClient.publish(topic, JSON.stringify({ state: "off" }));
}

/**
 * Loads a trigger configuration file
 * @param configFilePath The path to the configuration file
 * @returns The unvalidated raw JSON
 */
function readRawConfigFile(configFilePath: string): string {
  let rawConfig: string;
  try {
    rawConfig = fs.readFileSync(configFilePath, "utf-8");
  } catch (e) {
    log.warn("MQTT Manager", `Unable to read the configuration file: ${e.message}.`);
    return null;
  }

  // This shouldn't happen. Keeping the check here in case it does in the real world
  // and someone reports things not working.
  if (!rawConfig) {
    throw new Error(`[MQTT Manager] Unable to load configuration file ${configFilePath}.`);
  }

  return rawConfig;
}

/**
 * Takes a raw JSON string and converts it to an IMqttManagerConfigJson
 * @param rawConfig The raw JSON in a string
 * @returns An IMqttManagerConfigJson from the parsed JSON
 */
function parseConfigFile(rawConfig: string): IMqttManagerConfigJson {
  let parseErrors: JSONC.ParseError[];

  const mqttConfigJson = JSONC.parse(rawConfig, parseErrors) as IMqttManagerConfigJson;

  // This extra level of validation really shouldn't be necessary since the
  // file passed schema validation. Still, better safe than crashy.
  if (parseErrors && parseErrors.length > 0) {
    throw new Error(
      `[MQTT Manager] Unable to load configuration file: ${parseErrors
        .map(error => log.error("MQTT manager", `${error?.error}`))
        .join("\n")}`,
    );
  }

  return mqttConfigJson;
}
