/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as JSONC from "jsonc-parser";
import request from "request-promise-native";

import * as log from "./Log";
import IDeepStackResponse from "./types/IDeepStackResponse";

export default async function analyzeImage(fileName: string): Promise<IDeepStackResponse> {
  // This method of calling deepstack comes from https://nodejs.deepstack.cc/
  const imageStream = fs.createReadStream(fileName);
  const form = { image: imageStream };

  const rawResponse = await request
    .post({
      formData: form,
      uri: new URL("/v1/vision/detection", process.env.DEEPSTACK_URI).toString(),
    })
    .catch(e => {
      log.error("DeepStack", `Failed to call DeepStack at ${process.env.DEEPSTACK_URI}: ${e.error}`);
      return undefined;
    });
  return JSONC.parse(rawResponse) as IDeepStackResponse;
}
