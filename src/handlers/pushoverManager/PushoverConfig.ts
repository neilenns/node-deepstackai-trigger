/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default class PushoverConfig {
  public userKeys: string[];
  public caption?: string;
  public enabled: boolean;
  public cooldownTime: number;
  public annotateImage?: boolean;
  public sound?: string;

  constructor(init?: Partial<PushoverConfig>) {
    Object.assign(this, init);

    // Default for enabled is true if it isn't specified in the config file
    this.enabled = init?.enabled ?? true;

    // Default for the sound is Pushover default if undefined
    this.sound = init?.sound ?? "pushover";
  }
}
