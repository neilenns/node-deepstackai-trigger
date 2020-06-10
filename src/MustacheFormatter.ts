/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Mustache from "mustache";
import Trigger from "./Trigger";
import IDeepStackPrediction from "./types/IDeepStackPrediction";
import path from "path";

function formatPredictions(predictions: IDeepStackPrediction[]): string {
  return predictions
    .map(prediction => {
      return `${prediction.label} (${(prediction.confidence * 100).toFixed(0)}%)`;
    })
    .join(", ");
}

/**
 * Replaces mustache templates in a string with values
 * @param template The template string to format
 * @param fileName The filename of the image being analyzed
 * @param trigger The trigger that was fired
 * @param predictions The predictions returned by the AI system
 */
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
    formattedPredictions: formatPredictions(predictions),
    state: "on",
    name: trigger.name,
  };

  // Turn off escaping
  Mustache.escape = text => {
    return text;
  };

  return Mustache.render(template, view);
}
