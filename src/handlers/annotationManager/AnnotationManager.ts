/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createCanvas, loadImage, registerFont } from "canvas";
import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import imageSizeOf from "image-size";
import pify from "pify";
import Trigger from "../../Trigger";

import * as LocalStorageManager from "../../LocalStorageManager";
import * as log from "../../Log";
import * as fs from "fs";
import * as settings from "../../Settings";

// Wrap things in promises
const imageSizeOfP = pify(imageSizeOf);

export function initialize(): void {
  // The font gets loaded once here to work around race condition issues that were happening.
  // Solution comes from https://github.com/joshmarinacci/node-pureimage/issues/52#issuecomment-368066557
  registerFont("./fonts/CascadiaCode.ttf", { family: "Cascadia Code" });
}

/**
 * Generates an annotated image based on a list of predictions and
 * saves it to local storage, if the enabled flag is true on
 * annotationManager. If false does nothing and returns immediately.
 * @param fileName Filename of the image to annotate
 * @param trigger Trigger that fired
 * @param predictions List of matching predictions
 */
export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  predictions: IDeepStackPrediction[],
): Promise<void> {
  if (!settings.enableAnnotations) {
    return;
  }

  log.verbose("Annotations", `Annotating ${fileName}`);
  const outputFileName = LocalStorageManager.mapToLocalStorage(LocalStorageManager.Locations.Annotations, fileName);

  try {
    // This code is based on https://github.com/Automattic/node-canvas/blob/master/examples/image-caption-overlay.js
    const { width, height } = await imageSizeOfP(fileName);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    // Draw the base image
    const image = await loadImage(fileName);
    context.drawImage(image, 0, 0);

    // Draw the annotations
    context.strokeStyle = "rgba(255,0,0,0.75)";
    context.lineWidth = 4;
    context.fillStyle = "rgba(255,0,0,0.75)";
    context.font = "18pt Cascadia Code";
    context.textBaseline = "top";

    predictions.map(prediction => {
      const width = prediction.x_max - prediction.x_min;
      const height = prediction.y_max - prediction.y_min;
      context.strokeRect(prediction.x_min, prediction.y_min, width, height);
      context.fillText(
        `${prediction.label} (${(prediction.confidence * 100).toFixed(0)}%)`,
        prediction.x_min + 10,
        prediction.y_min + 24,
      );
    });

    canvas.createJPEGStream().pipe(fs.createWriteStream(outputFileName));
    log.verbose("Annotations", `Done annotating ${fileName}`);
  } catch (e) {
    log.warn("Annotations", `Unable to generate annotated image: ${e}`);
  }
}
