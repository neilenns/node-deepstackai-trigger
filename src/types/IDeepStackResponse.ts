/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import IDeepStackPrediction from "./IDeepStackPrediction";

export default interface IDeepStackResponse {
  success: boolean;
  predictions: IDeepStackPrediction[];
}
