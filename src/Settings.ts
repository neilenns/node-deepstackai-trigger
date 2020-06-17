/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IMqttManagerConfigJson from "./handlers/mqttManager/IMqttManagerConfigJson";
import ITelegramConfigJson from "./handlers/telegramManager/ITelegramConfigJson";
import IPushoverConfigJson from "./handlers/pushoverManager/IPushoverConfigJson";

export default class Settings {
  public mqtt: IMqttManagerConfigJson;
  public telegram: ITelegramConfigJson;
  public pushover: IPushoverConfigJson;
}
