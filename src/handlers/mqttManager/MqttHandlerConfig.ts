/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import MqttMessageConfig from "./MqttMessageConfig";

export default class MqttHandlerConfig {
  public messages: MqttMessageConfig[];
  public enabled: boolean;
  public statusTopic?: string;

  constructor(init?: Partial<MqttHandlerConfig>) {
    Object.assign(this, init);

    // Create the messages. Done this way to get real objects
    // with a constuctor that sets default values, instead of
    // rawproperty assignment done by Object.assign().
    this.messages = init?.messages.map(rawMessage => {
      return new MqttMessageConfig(rawMessage);
    });

    // Default for enabled is true if it isn't specified in the config file
    this.enabled = init?.enabled ?? true;
  }
}
