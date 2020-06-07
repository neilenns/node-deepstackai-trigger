/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import MqttConfig from "../../src/handlers/mqttManager/MqttConfig";

test("Verify MQTT handler configuration", () => {
  // Empty constructor should default to enabled true and offDelay 30
  let config = new MqttConfig();
  expect(config.enabled).toBe(true);
  expect(config.offDelay).toBe(30);

  // Undefined enabled should be true
  config = new MqttConfig({ enabled: undefined });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled true should be true
  config = new MqttConfig({ enabled: true });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled false should be false
  config = new MqttConfig({ enabled: false });
  expect(config.enabled).toBe(false);

  // Undefined offDelay should default to 30
  config = new MqttConfig({ offDelay: undefined });
  expect(config.offDelay).toBe(30);

  // 0 offDelay should be 0
  config = new MqttConfig({ offDelay: 0 });
  expect(config.offDelay).toBe(0);

  // 60 offDelay should be 60
  config = new MqttConfig({ offDelay: 60 });
  expect(config.offDelay).toBe(60);
});
