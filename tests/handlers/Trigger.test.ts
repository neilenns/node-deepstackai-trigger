/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import Trigger from "../../src/Trigger";

test("Verify isRegisteredForObject()", () => {
  // Empty constructor should default to enabled true
  const trigger = new Trigger();
  trigger.name = "Trigger.test.ts";

  trigger.watchObjects = ["dog"];
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(true);

  trigger.watchObjects = [];
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(false);

  trigger.watchObjects = undefined;
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(false);

  trigger.watchObjects = null;
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(false);

  trigger.watchObjects = ["DoG"];
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(false);

  trigger.watchObjects = ["dog"];
  expect(trigger.isRegisteredForObject("unit test", "doG")).toBe(false);

  trigger.watchObjects = ["cat", "elephant"];
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(false);
});
