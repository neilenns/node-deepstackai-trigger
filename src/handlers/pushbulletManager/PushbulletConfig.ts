/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default class PushoverConfig {
  public annotateImage?: boolean;
  public caption?: string;
  public cooldownTime: number;
  public enabled: boolean;

  constructor(init?: Partial<PushoverConfig>) {
    Object.assign(this, init);

    // Default for enabled is true if it isn't specified in the config file
    this.enabled = init?.enabled ?? true;
  }
}
