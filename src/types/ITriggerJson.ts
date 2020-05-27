/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import IMqttConfigJson from "../handlers/mqttManager/IMqttConfigJson";
import IWebRequestHandlerJson from "../handlers/webRequest/IWebRequestHandlerJson";

export default interface ITriggerJson {
  cooldownTime: number;
  enabled: boolean;
  name: string;
  threshold: {
    minimum: number;
    maximum: number;
  };
  watchPattern: string;
  watchObjects: string[];

  // Handler settings
  handlers: {
    webRequest: IWebRequestHandlerJson;
    mqtt: IMqttConfigJson;
  };
}
