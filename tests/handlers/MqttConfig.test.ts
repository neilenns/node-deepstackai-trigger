/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import MqttHandleConfig from "../../src/handlers/mqttManager/MqttHandlerConfig";

test("Verify MQTT handler configuration", () => {
  // Empty constructor should default to enabled true
  let config = new MqttHandleConfig();
  expect(config.enabled).toBe(true);

  // Undefined enabled should be true
  config = new MqttHandleConfig({ enabled: undefined });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled true should be true
  config = new MqttHandleConfig({ enabled: true });
  expect(config.enabled).toBe(true);

  // Explicitly set enabled false should be false
  config = new MqttHandleConfig({ enabled: false });
  expect(config.enabled).toBe(false);

  // Undefined offDelay should default to 30
  config = new MqttHandleConfig({ messages: [{ offDelay: undefined, topic: "" }] });
  expect(config.messages[0].offDelay).toBe(30);

  // 0 offDelay should be 0
  config = new MqttHandleConfig({ messages: [{ offDelay: 0, topic: "" }] });
  expect(config.messages[0].offDelay).toBe(0);

  // 60 offDelay should be 60
  config = new MqttHandleConfig({ messages: [{ offDelay: 60, topic: "" }] });
  expect(config.messages[0].offDelay).toBe(60);
});
