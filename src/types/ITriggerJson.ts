/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import IMqttHandlerConfigJson from "../handlers/mqttManager/IMqttHandlerConfigJson";
import IPushoverConfigJson from "../handlers/pushoverManager/IPushoverConfigJson";
import ITelegramConfigJson from "../handlers/telegramManager/ITelegramConfigJson";
import IWebRequestHandlerJson from "../handlers/webRequest/IWebRequestHandlerJson";
import Rect from "../Rect";
import IPushbulletConfigJson from "../handlers/pushbulletManager/IPushoverConfigJson";

export default interface ITriggerJson {
  cooldownTime: number;
  customEndpoint?: string;
  enabled: boolean;
  name: string;
  snapshotUri: string;
  threshold: {
    minimum: number;
    maximum: number;
  };
  watchPattern?: string;
  watchObjects: string[];

  // Handler settings
  handlers: {
    webRequest: IWebRequestHandlerJson;
    mqtt: IMqttHandlerConfigJson;
    telegram: ITelegramConfigJson;
    pushbullet: IPushbulletConfigJson;
    pushover: IPushoverConfigJson;
  };

  masks: Rect[];
  activateRegions: Rect[];
}
