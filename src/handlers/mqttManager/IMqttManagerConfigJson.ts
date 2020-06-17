/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default interface IMqttManagerConfigJson {
  uri: string;
  username: string;
  password: string;
  rejectUnauthorized: boolean;
  statusTopic?: string;
  enabled?: boolean;
}
