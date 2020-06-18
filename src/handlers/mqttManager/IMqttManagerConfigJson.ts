/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default interface IMqttManagerConfigJson {
  enabled?: boolean;
  password: string;
  rejectUnauthorized: boolean;
  retain?: boolean;
  statusTopic?: string;
  uri: string;
  username: string;
}
