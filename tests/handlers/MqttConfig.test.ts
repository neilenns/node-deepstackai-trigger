/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import MqttConfig from "../../src/handlers/mqttManager/MqttConfig";

test("Verify MQTT handler configuration", () => {
  // Empty constructor should default to enabled true
  let config = new MqttConfig();
  expect(config.enabled).toBe(true);

  // Undefined enabled should be true
  config = new MqttConfig({ enabled: undefined });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled true should be true
  config = new MqttConfig({ enabled: true });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled false should be false
  config = new MqttConfig({ enabled: false });
  expect(config.enabled).toBe(false);
});
