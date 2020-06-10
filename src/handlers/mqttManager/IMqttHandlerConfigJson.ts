/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import IMqttMessageConfigJson from "./IMqttMessageConfigJson";

export default interface IMqttHandlerConfigJson {
  messages: IMqttMessageConfigJson[];
  enabled?: boolean;
}
