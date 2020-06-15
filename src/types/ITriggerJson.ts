/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import IMqttHandlerConfigJson from "../handlers/mqttManager/IMqttHandlerConfigJson";
import ITelegramConfigJson from "../handlers/telegramManager/ITelegramConfigJson";
import IWebRequestHandlerJson from "../handlers/webRequest/IWebRequestHandlerJson";
import Rect from "../Rect";
import IPushoverConfigJson from "../handlers/pushoverManager/IPushoverConfigJson";

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
    mqtt: IMqttHandlerConfigJson;
    telegram: ITelegramConfigJson;
    pushover: IPushoverConfigJson;
  };

  masks: Rect[];
}
