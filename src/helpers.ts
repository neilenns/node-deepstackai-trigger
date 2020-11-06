/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as JSONC from "jsonc-parser";
import Mustache from "mustache";
import * as log from "./Log";

function readFile(serviceName: string, fileType: string, filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    log.warn(serviceName, `Unable to read the ${fileType} file: ${e.message}.`);
    return null;
  }
}

function parseFile(serviceName: string, fileType: string, filePath: string) {
  const file = readFile(serviceName, fileType, filePath);
  return file ? JSONC.parse(file) : null;
}

/**
 * Mustache renders secrets into settings and validates settings with JSON schema, then returns it as a typed object.
 * @param settings The settings of type T
 * @param secrets An object of strings representing secrets
 * @type T The type the settings should return as.
 */
function replaceSecrets<T>(settings: T, secrets: { a: string }) {
  // If no secrets were provided don't attempt to do a replacement
  if (!secrets) return settings;

  return JSONC.parse(Mustache.render(JSON.stringify(settings), secrets));
}

/**
 * Loads a settings file and validates it with JSON schema, then returns it as a typed object.
 * @param serviceName The name of the service loading the settings. Used in log messages.
 * @param settingsFileName The path to the file to load.
 * @type T The type the settings should return as.
 */
export function readSettings<T>(serviceName: string, serviceFilePath: string, secretsFilePath = ""): T {
  const settings = parseFile(serviceName, "settings", serviceFilePath);
  if (!settings) {
    log.warn(serviceName, `Unable to load file ${serviceFilePath}.`);
    return null;
  }
  const secrets = parseFile(serviceName, "secrets", secretsFilePath);
  return replaceSecrets<T>(settings, secrets);
}
