# Change Log

## Version 1.2.0

- Changes try/catch to .catch() for issue [#68](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/68)

## Version 1.1.5

- Add a cooldownTime option to the Telegram handler. This makes it easier
  to have a trigger that fires frequently without spamming Telegram chats with
  pictures.

## Version 1.1.4

- Fixed a bug where MQTT log messages contained "Trigger" as the message tag.

## Version 1.1.3

- Resolve an issue where disabling Telegram prevented startup

## Version 1.1.2

- Add timestamp to log messages

## Version 1.1.1

- Added two optional dependencies to resolve build warnings

## Version 1.1.0

- Added support for Telegram bots

## Version 1.0.4

- Updated the README.md sample with the new MQTT message format
  from v1.0.1.

## Version 1.0.3

- There was no version 1.0.3. Tag issues with git.

## Version 1.0.2

- Minor file code structure cleanup

## Version 1.0.1

- MQTT messages now inclue a fileName and baseFileName property.
  Technically this is a breaking change since it moves the predictions
  to a predictions property too.

## Version 1.0.0

- Released 2020-05-25
- Initial release
