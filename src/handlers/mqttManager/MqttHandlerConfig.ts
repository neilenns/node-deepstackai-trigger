/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import MqttMessageConfig from "./MqttMessageConfig";

export default class MqttHandlerConfig {
  public topic?: string;
  public messages: MqttMessageConfig[];
  public enabled: boolean;
  public statusTopic?: string;

  constructor(init?: Partial<MqttHandlerConfig>) {
    Object.assign(this, init);

    // Clear out anything that might have been set by Object.assign().
    this.messages = [];

    // Create the messages. Done this way to get real objects
    // with a constuctor that sets default values, instead of
    // raw property assignment done by Object.assign().
    init?.messages?.map(rawMessage => {
      this.messages.push(new MqttMessageConfig(rawMessage));
    });

    // For backwards compatibility with installations prior to
    // allowing an array of messages this still supports specifying
    // a single topic. If that topic exists turn it into a
    // message config object.
    if (init?.topic) {
      this.messages.push(new MqttMessageConfig({ topic: this.topic }));
    }

    // Default for enabled is true if it isn't specified in the config file
    this.enabled = init?.enabled ?? true;
  }
}
