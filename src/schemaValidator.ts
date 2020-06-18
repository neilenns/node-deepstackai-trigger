/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as log from "./Log";

import Ajv from "ajv";
import ajvkeywords from "ajv-keywords";
import maskConfiguration from "./schemas/maskConfiguration.schema.json";
import mqttHandlerConfiguration from "./schemas/mqttHandlerConfiguration.schema.json";
import mqttManagerConfiguration from "./schemas/mqttManagerConfiguration.schema.json";
import pushoverHandlerConfiguration from "./schemas/pushoverHandlerConfiguration.schema.json";
import pushoverManagerConfiguration from "./schemas/pushoverManagerConfiguration.schema.json";
import settingsSchema from "./schemas/settings.schema.json";
import telegramHandlerConfiguration from "./schemas/telegramHandlerConfiguration.schema.json";
import telegramManagerConfiguration from "./schemas/telegramManagerConfiguration.schema.json";
import triggerSchema from "./schemas/triggerConfiguration.schema.json";
import webRequestHandlerConfig from "./schemas/webRequestHandlerConfig.schema.json";

/**
 * Validates an object against a schema file
 * @param schemaFileName The path to the schema file
 * @param obj The object to validate
 * @returns True if valid, false otherwise.
 */
export default async function validateJsonAgainstSchema(
  schemaFileName: Record<string, unknown>,
  jsonObject: unknown,
): Promise<boolean> {
  const validator = new Ajv();

  ajvkeywords(validator, "transform");

  // Register all the schemas that get used with this app. It doesn't matter
  // if they are for different schema files/uses, ajv only loads them when
  // actually required by the file being processed.
  validator.addSchema(
    maskConfiguration,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/maskConfiguration.schema.json",
  );
  validator.addSchema(
    mqttHandlerConfiguration,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/mqttHandlerConfiguration.schema.json",
  );
  validator.addSchema(
    mqttManagerConfiguration,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/mqttManagerConfiguration.schema.json",
  );
  validator.addSchema(
    pushoverHandlerConfiguration,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/pushoverHandlerConfiguration.schema.json",
  );
  validator.addSchema(
    pushoverManagerConfiguration,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/pushoverManagerConfiguration.schema.json",
  );
  validator.addSchema(
    settingsSchema,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/settings.schema.json",
  );
  validator.addSchema(
    triggerSchema,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/triggerConfiguration.schema.json",
  );
  validator.addSchema(
    telegramManagerConfiguration,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/telegramManagerConfiguration.schema.json",
  );
  validator.addSchema(
    telegramHandlerConfiguration,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/telegramHandlerConfiguration.schema.json",
  );
  validator.addSchema(
    webRequestHandlerConfig,
    "https://raw.githubusercontent.com/danecreekphotography/node-blueiris-deepstack-ai/master/src/schemas/webRequestHandlerConfig.schema.json",
  );

  const isValid = await validator.validate(schemaFileName, jsonObject);

  if (!isValid) {
    validator?.errors.map(error => {
      log.error("Schema Validator", `${error?.dataPath}: ${error?.message}`);
    });
  }

  return isValid;
}
