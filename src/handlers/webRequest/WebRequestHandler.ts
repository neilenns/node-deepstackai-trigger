/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import request from "request-promise-native";

import * as log from "../../Log";
import Trigger from "../../Trigger";
import IDeepStackPrediction from "../../types/IDeepStackPrediction";

/**
 * Handles calling a list of web URLs.
 */
export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  predictions: IDeepStackPrediction[],
): Promise<void[]> {
  // It's possible to not set up a web request handler on a trigger or to disable it, so don't
  // process if that's the case.
  if (!trigger?.webRequestHandlerConfig?.enabled) {
    return [];
  }

  return Promise.all(trigger.webRequestHandlerConfig.triggerUris?.map(uri => callTriggerUri(fileName, trigger, uri)));
}

/**
 * Calls a single trigger uri, handling failures if any.
 * @param uri The uri to trigger
 */
async function callTriggerUri(fileName: string, trigger: Trigger, uri: string): Promise<void> {
  log.info("Web request", `${fileName}: Calling trigger uri ${uri}`);
  await request.get(uri).catch(e => {
    log.warn("Web request", `${fileName}: Failed to call trigger uri ${uri}: ${e}`);
  });
}
