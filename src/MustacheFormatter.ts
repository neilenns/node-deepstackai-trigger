/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Mustache from "mustache";
import Trigger from "./Trigger";
import IDeepStackPrediction from "./types/IDeepStackPrediction";
import path from "path";

export function format(
  template: string,
  fileName: string,
  trigger: Trigger,
  predictions: IDeepStackPrediction[],
): string {
  // Populate the payload wih the mustache template
  const view = {
    fileName,
    baseName: path.basename(fileName),
    predictions: JSON.stringify(predictions),
    state: "on",
    name: trigger.name,
  };

  // Turn off escaping
  Mustache.escape = text => {
    return text;
  };

  return Mustache.render(template, view);
}
