# Change Log

## Version 1.9.0

- MQTT status messages with statistics are now sent on every received file. The total
  number of files received and the number of triggers actually fired are included in
  the message payload. Resolves [issue 146](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/146).
- Add a clear message after initialization indicating whether startup was successful.
  If it wasn't there's now a link to a troubleshooting wiki page for assistance. Resolves
  [issue 167](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/167).
- Fix typos in the source code. Resolves [issue 170](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/170).
- Fix typos in CHANGELOG.md. Resolves [issue 168](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/168).

## Version 1.8.0

- The system no longer exits when configuration errors prevent startup. This leaves the container in
  a running state so it is possible to open a terminal window to the container to inspect
  things like volume mount points for missing configuration files. Resolves [issue 164](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/154).
- Telegram trigger handlers now support an optional `caption` property to specify the text sent
  as the caption for the photo that fired the trigger. This supports mustache templates so the
  caption can be something like `{{name}}: {{formattedPredictions}}`. Resolves [issue 154](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/154).
- MQTT trigger handlers now support an array of messages to send instead of a single message, allowing
  for different format messages to different services. For example one message could be formatted
  in a way that works for Home Assistant use and another could be formatted to trigger BlueIris recording.
  This is an optional, more advanced, way to specify MQTT triggers. The previous, simple, single `topic`
  method still works and is recommended for most use cases. See [the wiki](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-mqtt-handlers)
  for an example of the new format. Resolves [issue 153](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/153).
- A `payload` property is now supported on MQTT handler message configuration, along with support for
  mustache templates in the payload. This makes it possible to send a precisely formatted
  message to BlueIris that will trigger recording for a specific camera instead of having
  to use webRequest handlers. Resolves [issue 151](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/151).
- Mustache templates are now supported in the webRequest handler URIs. One way to use this is
  to send additional data to BlueIris with the details of predictions that caused the trigger to fire,
  for example `"http://localhost:81/admin?trigger&camera=Dog&memo={{formattedPredictions}}`.
  See [the wiki](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers) for
  details on available mustache variables. Resolves [issue 148](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/148).
- The MQTT overall configuration now supports specifying a topic for status messages.
  Right now the only status message sent is a LWT message for when the system goes
  offline. Resolves [issue 145](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/145).
- Logging level is now controlled by a `VERBOSE` environment variable. When set to `true`
  additional logging is shown in the console. When `false` or omitted only startup and
  successful detection messages are shown. Resolves [issue 143](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/145).

## Version 1.7.0

- Add a `state` property to the MQTT messages sent on motion detection. This
  makes it easier to build binary motion sensors based on the MQTT messages in Home Assistant
  by using `value_template: 'value_json.state'`. The delay before sending an `off` state is
  configurable with the new `offDelay` setting on `mqtt` triggers. Resolves [issue 139](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/139) and [issue 141](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/141).

## Version 1.6.0

- watchObjects is now case insensitive when comparing against the matched objects ([issue 134](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/134))
- Address a warning during config file validation ([issue 123](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/123)).
- Document the available Docker image tags ([issue 128](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/128)).
- Addresses code cleanup [issue 136](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/136).

## Version 1.5.0

- Configuration files can now be mounted using Docker volumes instead of secrets. While less
  secure for MQTT configuration it does enable this image to load on systems that don't support
  setting Docker secrets, such as a Synology. Addresses [issue 122](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/122).
- Address [issue 116](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/116).
- Address [issue 130](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/130).

## Version 1.4.0

- Add support for mask regions to triggers. See the [defining triggers](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-masks)
  documentation for information on how to set this up.
- README.md updated to provide simplified instructions and links to
  the project wiki for additional details

## Version 1.3.0

- The default mount point for the image folder in the sample configuration now points
  to /aiinput. This better aligns with future documentation and will simplify configuration
  for first time users following the step by step guide. Existing `docker-compose.yml` and
  `trigger.conf` files aren't impacted as they won't be copying the new sample files locally.
  Developers working on the project using _Remote - Containers_ will need to rebuild their
  containers to pick up the new mount point. VSCode should automatically prompt for this.

## Version 1.2.1

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

- MQTT messages now includes a fileName and baseFileName property.
  Technically this is a breaking change since it moves the predictions
  to a predictions property too.

## Version 1.0.0

- Released 2020-05-25
- Initial release
