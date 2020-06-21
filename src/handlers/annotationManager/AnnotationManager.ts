/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Trigger from "../../Trigger";
import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import PImage from "pureimage";

import * as LocalStorageManager from "../../LocalStorageManager";
import * as log from "../../Log";
import * as fs from "fs";
import * as settings from "../../Settings";

export async function initialize(): Promise<void> {
  // The font gets loaded once here to work around race condition issues that were happening.
  // Solution comes from https://github.com/joshmarinacci/node-pureimage/issues/52#issuecomment-368066557
  await PImage.registerFont("./fonts/CascadiaCode.ttf", "Cascadia Code").load();
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

  const decodedImage = await PImage.decodeJPEGFromStream(fs.createReadStream(fileName));
  const context = decodedImage.getContext("2d");
  context.strokeStyle = "rgba(255,0,0,0.75)";
  context.fillStyle = "rgba(255,0,0,0.75)";
  context.font = "18pt Cascadia Code";
  context.fontBaseline = "top";

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

  await PImage.encodeJPEGToStream(decodedImage, fs.createWriteStream(outputFileName), 75);
  log.verbose("Annotations", `Done annotating ${fileName}`);
}
