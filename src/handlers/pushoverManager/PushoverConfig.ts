/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default class PushoverConfig {
  public chatIds: number[];
  public caption?: string;
  public enabled: boolean;
  public cooldownTime: number;
  public annotateImage?: boolean;

  constructor(init?: Partial<PushoverConfig>) {
    Object.assign(this, init);

    // Default for enabled is true if it isn't specified in the config file
    this.enabled = init?.enabled ?? true;
  }
}
