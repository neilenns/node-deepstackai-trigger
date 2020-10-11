/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {closeSync, existsSync, openSync, unlinkSync, writeFileSync} from 'fs';
import * as JSONC from "jsonc-parser";
import * as helpers from "./../src/helpers";

describe("helpers", () => {
  const settingsFilePath = `${__dirname}/settings.json`;

  beforeEach(() => {
    closeSync(openSync(settingsFilePath, 'w'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (existsSync(settingsFilePath)) {
      unlinkSync(settingsFilePath);
    }
  });

   test("Verify can load settings.json", () => {
     const serviceName = "Settings";
     const expectedSettings = {"foo": "bar"};
     writeFileSync(settingsFilePath, JSON.stringify(expectedSettings));

     const actualSettings = helpers.readSettings(serviceName, settingsFilePath);

     expect(actualSettings).toEqual(expectedSettings);
   });

   test("Verify cannot load settings.json because it does not exist", () => {
     //eslint-disable-next-line no-console
     console.log = jest.fn();
     const serviceName = "Settings";
     unlinkSync(settingsFilePath);

     const actualSettings = helpers.readSettings(serviceName, settingsFilePath);

     //eslint-disable-next-line no-console
     expect(console.log).toHaveBeenCalledWith(expect.stringContaining("[Settings] Unable to read the configuration file: ENOENT: no such file or directory"));
     expect(actualSettings).toBeNull();
   });

   test("Verify throws if rawConfig empty", () => {
     const serviceName = "Settings";
     const expectedSettings = "";
     writeFileSync(settingsFilePath, expectedSettings);

     expect(() => {helpers.readSettings(serviceName, settingsFilePath)}).toThrow(Error);
   });

   test("Verify throws with message if rawConfig empty", () => {
     const serviceName = "Settings";
     const expectedSettings = "";
     writeFileSync(settingsFilePath, expectedSettings);

     try {
       helpers.readSettings(serviceName, settingsFilePath);
     } catch (error) {
       expect(error.message).toBe(`[${serviceName}] Unable to load configuration file ${settingsFilePath}.`);
     }
   });

  test("Verify throws if json invalid", () => {
    const serviceName = "Settings";
    const expectedSettings = {};
    writeFileSync(settingsFilePath, JSON.stringify(expectedSettings));
    const mockAddListener = jest.spyOn(JSONC, 'parse');
    mockAddListener.mockImplementation((rawConfig, parseErrors) => {
        parseErrors.push({
            error: 1,
            offset: 2,
            length: 3,
        });
        return {};
    });

    expect(() => {helpers.readSettings(serviceName, settingsFilePath)}).toThrow(Error);
  });

  test("Verify throws with message if json invalid", () => {
    const serviceName = "Settings";
    const expectedSettings = {};
    writeFileSync(settingsFilePath, JSON.stringify(expectedSettings));
    const mockAddListener = jest.spyOn(JSONC, 'parse');
    const parseError1 = {
      error: 1,
      offset: 2,
      length: 3,
    };
    const parseError2 = {
      error: 3,
      offset: 2,
      length: 1,
    };
    mockAddListener.mockImplementation((rawConfig, parseErrors) => {
        parseErrors.push(parseError1);
        parseErrors.push(parseError2);
        return {};
    });
    //eslint-disable-next-line no-console
    console.log = jest.fn();

     try {
       helpers.readSettings(serviceName, settingsFilePath);
     } catch (error) {
       const parseErrorsAsString = `${JSON.stringify(parseError1)} ${JSON.stringify(parseError2)}`;
       //eslint-disable-next-line no-console
       expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`[${serviceName}] ${parseErrorsAsString}`));
       expect(error.message).toBe(`[${serviceName}] Unable to load configuration file: ${parseErrorsAsString}`);
     }
  });
});

