/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default class MqttMessageConfig {
  public offDelay: number;
  public topic: string;
  public payload?: string;

  constructor(init?: Partial<MqttMessageConfig>) {
    Object.assign(this, init);

    // Default offDelay is 30 seconds if not specified
    this.offDelay = init?.offDelay ?? 30;
  }
}
