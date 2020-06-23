/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import IMqttManagerConfigJson from "../handlers/mqttManager/IMqttManagerConfigJson";
import ITelegramManagerConfigJson from "../handlers/telegramManager/ITelegramManagerConfigJson";
import IPushbulletManagerConfigJson from "../handlers/pushbulletManager/IPushbulletManagerConfigJson";
import IPushoverManagerConfigJson from "../handlers/pushoverManager/IPushoverManagerConfigJson";

export default interface ISettingsConfigJson {
  awaitWriteFinish?: boolean;
  deepstackUri: string;
  enableAnnotations?: boolean;
  enableWebServer?: boolean;
  mqtt?: IMqttManagerConfigJson;
  port?: number;
  processExistingImages?: boolean;
  purgeAge?: number;
  purgeInterval?: number;
  pushbullet?: IPushbulletManagerConfigJson;
  pushover?: IPushoverManagerConfigJson;
  telegram?: ITelegramManagerConfigJson;
  verbose?: boolean;
}
