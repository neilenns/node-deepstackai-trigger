/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as JSONC from "jsonc-parser";
import * as Settings from "./Settings";

import request from "request-promise-native";
import IDeepStackResponse from "./types/IDeepStackResponse";

export default async function analyzeImage(fileName: string): Promise<IDeepStackResponse> {
  // This method of calling DeepStack comes from https://nodejs.deepstack.cc/
  const imageStream = fs.createReadStream(fileName);
  const form = { image: imageStream };

  const rawResponse = await request
    .post({
      formData: form,
      uri: new URL("/v1/vision/detection", Settings.deepstackUri).toString(),
    })
    .catch(e => {
      throw Error(`Failed to call DeepStack at ${Settings.deepstackUri}: ${e.error}`);
    });

  return JSONC.parse(rawResponse) as IDeepStackResponse;
}
