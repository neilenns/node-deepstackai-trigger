/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import Trigger from "../src/Trigger";
import validateJsonAgainstSchema from "../src/schemaValidator";
import triggerConfigJson from "../src/schemas/triggerConfiguration.schema.json";
import triggerJson from "./triggers.json";

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
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(true);

  trigger.watchObjects = ["dog"];
  expect(trigger.isRegisteredForObject("unit test", "doG")).toBe(true);

  trigger.watchObjects = ["cat", "elephant"];
  expect(trigger.isRegisteredForObject("unit test", "dog")).toBe(false);

  trigger.watchObjects = ["cat", "elephant"];
  expect(trigger.isRegisteredForObject("unit test", undefined)).toBe(false);
});

test("Verify isRegisteredForObject()", async () => {
  await expect(validateJsonAgainstSchema(triggerJson, triggerConfigJson)).resolves.toEqual(true);

  // Check that case doesn't matter for string arrays that take an enum
  triggerJson.triggers[0].watchObjects = ["dOg"];
  await expect(validateJsonAgainstSchema(triggerJson, triggerConfigJson)).resolves.toEqual(true);
});
