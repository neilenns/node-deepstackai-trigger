/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Mustache from "mustache";
import path from "path";

import Trigger from "./Trigger";
import IDeepStackPrediction from "./types/IDeepStackPrediction";

export function formatPredictions(predictions: IDeepStackPrediction[]): string {
  return predictions
    .map(prediction => {
      return `${prediction.label} (${(prediction.confidence * 100).toFixed(0)}%)`;
    })
    .join(", ");
}

function optionallyEncode(value: string, urlEncode: boolean): string {
  return urlEncode ? encodeURIComponent(value) : value;
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
  urlEncode = false,
): string {
  // Populate the payload wih the mustache template
  const view = {
    fileName: optionallyEncode(fileName, urlEncode),
    baseName: optionallyEncode(path.basename(fileName), urlEncode),
    predictions: optionallyEncode(JSON.stringify(predictions), urlEncode),
    analysisDurationMs: trigger.analysisDuration,
    formattedPredictions: optionallyEncode(formatPredictions(predictions), urlEncode),
    state: "on",
    name: trigger.name,
  };

  // Turn off escaping
  Mustache.escape = text => {
    return text;
  };

  return Mustache.render(template, view);
}
