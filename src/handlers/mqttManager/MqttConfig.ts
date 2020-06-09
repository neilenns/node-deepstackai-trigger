/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default class MqttConfig {
  public topic: string;
  public enabled: boolean;
  public offDelay: number;
  public statusTopic?: string;
  public payload?: string;

  constructor(init?: Partial<MqttConfig>) {
    Object.assign(this, init);

    // Default for enabled is true if it isn't specified in the config file
    this.enabled = init?.enabled ?? true;

    // Default offDelay is 30 seconds if not specified
    this.offDelay = init?.offDelay ?? 30;
  }
}
