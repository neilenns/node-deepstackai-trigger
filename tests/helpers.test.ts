/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { closeSync, existsSync, openSync, unlinkSync, writeFileSync } from "fs";
import * as helpers from "./../src/helpers";

describe("helpers", () => {
  const serviceName = "Settings";
  const settingsFilePath = `${__dirname}/settings.json`;
  const secretsFilePath = `${__dirname}/secrets.json`;
  //eslint-disable-next-line no-console
  console.log = jest.fn();

  beforeEach(() => {
    closeSync(openSync(settingsFilePath, "w"));
  });

  afterEach(() => {
    existsSync(settingsFilePath) && unlinkSync(settingsFilePath);
    existsSync(secretsFilePath) && unlinkSync(secretsFilePath);
  });

  test("Verify can load settings.json", () => {
    const expectedSettings = { foo: "bar" };
    writeFileSync(settingsFilePath, JSON.stringify(expectedSettings));

    const actualSettings = helpers.readSettings(serviceName, settingsFilePath);

    expect(actualSettings).toEqual(expectedSettings);
  });

  test("Verify can load settings.json with secrets", () => {
    const secrets = { someSecret: "bar" };
    writeFileSync(secretsFilePath, JSON.stringify(secrets));
    const settings = { foo: "{{someSecret}}" };
    writeFileSync(settingsFilePath, JSON.stringify(settings));

    const actualSettings = helpers.readSettings(serviceName, settingsFilePath, secretsFilePath);

    expect(actualSettings).toEqual({ foo: "bar" });
  });

  test("Verify secret is rendered empty if it doesn't exist'", () => {
    const secrets = {};
    writeFileSync(secretsFilePath, JSON.stringify(secrets));
    const settings = { foo: "{{someSecret}}" };
    writeFileSync(settingsFilePath, JSON.stringify(settings));

    const actualSettings = helpers.readSettings(serviceName, settingsFilePath, secretsFilePath);

    expect(actualSettings).toEqual({ foo: "" });
  });

  test("Verify cannot load settings.json because it does not exist", () => {
    unlinkSync(settingsFilePath);

    try {
      helpers.readSettings(serviceName, settingsFilePath);
    } catch (error) {
      //eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(`[${serviceName}] Unable to read the settings file: ENOENT: no such file or directory`),
      );
      expect(error.message).toBe(`[${serviceName}] Unable to load file ${settingsFilePath}.`);
    }
  });

  test("Verify cannot load secrets.json because it does not exist", () => {
    const expectedSettings = { foo: "bar" };
    writeFileSync(settingsFilePath, JSON.stringify(expectedSettings));

    const actualSettings = helpers.readSettings(serviceName, settingsFilePath);

    //eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`[${serviceName}] Unable to read the secrets file: ENOENT: no such file or directory`),
    );
    expect(actualSettings).toEqual(expectedSettings);
  });

  test("Verify throws if settings.json empty", () => {
    const expectedSettings = "";
    writeFileSync(settingsFilePath, expectedSettings);

    expect(() => {
      helpers.readSettings(serviceName, settingsFilePath);
    }).toThrow(Error);
  });

  test("Verify throws with message if settings.json empty", () => {
    const expectedSettings = "";
    writeFileSync(settingsFilePath, expectedSettings);

    try {
      helpers.readSettings(serviceName, settingsFilePath);
    } catch (error) {
      expect(error.message).toBe(`[${serviceName}] Unable to load file ${settingsFilePath}.`);
    }
  });
});
