/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as JSONC from "jsonc-parser";
import * as log from "./Log";

/**
 * Loads a settings file and validates it with JSON schema, then returns it as a typed object.
 * @param serviceName The name of the service loading the settings. Used in log messages.
 * @param settingsFileName The path to the file to load.
 * @type T The type the settings should return as.
 */
export function readSettings<T>(serviceName: string, settingsFileName: string): T {
  let rawConfig: string;
  try {
    rawConfig = fs.readFileSync(settingsFileName, "utf-8");
  } catch (e) {
    log.warn(serviceName, `Unable to read the configuration file: ${e.message}.`);
    return null;
  }

  // This shouldn't happen. Keeping the check here in case it does in the real world
  // and someone reports things not working.
  if (!rawConfig) {
    throw new Error(`[${serviceName}] Unable to load configuration file ${settingsFileName}.`);
  }

  const parseErrors: JSONC.ParseError[] = [];

  const settings = JSONC.parse(rawConfig, parseErrors) as T;

  // This extra level of validation really shouldn't be necessary since the
  // file passed schema validation. Still, better safe than crashing.
  if (parseErrors && parseErrors.length > 0) {
    const parseErrorsAsString = parseErrors.map(parseError => JSON.stringify(parseError)).join(" ");
    log.error(serviceName, parseErrorsAsString);
    const errorMessage = `[${serviceName}] Unable to load configuration file: ${parseErrorsAsString}`;
    throw new Error(errorMessage);
  }

  return settings;
}
