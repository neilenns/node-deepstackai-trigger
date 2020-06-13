/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Trigger from "../../Trigger";
import IDeepStackPrediction from "../../types/IDeepStackPrediction";
import * as LocalStorageManager from "../../LocalStorageManager";
import PImage from "pureimage";
import * as fs from "fs";

export async function processTrigger(
  fileName: string,
  trigger: Trigger,
  predictions: IDeepStackPrediction[],
): Promise<string> {
  const decodedImage = await PImage.decodeJPEGFromStream(fs.createReadStream(fileName));
  const context = decodedImage.getContext("2d");
  context.strokeStyle = "rgba(255,0,0,0.75)";

  predictions.map(prediction => {
    context.strokeRect(prediction.x_min, prediction.y_min, prediction.x_max, prediction.y_max);
  });

  const outputFileName = LocalStorageManager.mapToLocalStorage(fileName);
  PImage.encodeJPEGToStream(decodedImage, fs.createWriteStream(outputFileName), 75);
  return outputFileName;
}
