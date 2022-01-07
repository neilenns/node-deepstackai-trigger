# Change Log

## Unreleased
- Upgrade node from v12 to v16
- Whenever a image processing attempt fails, retry at least 2 more times before giving up. This is to avoid losing notifications due to occasional blips during the Ai identification process.
- Added readme documentation to describe how to manually publish your own version of this project to docker hub.

## 5.8.5

- Address security vulnerabilities in dependent packages. Resolves [issue 443](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/443) and
[issue 444](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/444).

## 5.8.4

- Address security vulnerabilities in dependent packages. Resolves [issue 440](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/440).

## 5.8.3

- Address security vulnerabilities in dependent packages. Resolves [issue 437](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/437).

## 5.8.2

- Address security vulnerabilities in dependent packages. Resolves [issue 434](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/434).

## 5.8.1

- Addresses a security vulnerability in a dependency. Resolves [issue 427](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/427).

## 5.8.0

- System now sends an MQTT message every 60 seconds to report its status as online. Resolves [issue 423](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/423).

## 5.7.0

- Add support for `customEndpoint` on a trigger to support custom Deepstack models. Resolves [issue 416](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/416).
- Support for glob patterns in trigger watchPatterns. Resolves [issue 412](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/412).

## 5.6.1

- Address a minor security vulnerability in a dependency. Resolves [issue 407](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/407).

## 5.6.0

- Support disabling auto-purge by specifying a `purgeInterval` of `0`. Resolves [issue 399](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/399).

## 5.5.1

- Resolve an issue where the system fails to start if no secrets file exists but the existing `settings.json` or `triggers.json` file uses
  mustache templates, or when the secrets method of loading the settings file isn't used. Resolves [issue 394](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/394).

## 5.5.0

- Secrets can now be stored in a separate `secrets.json` file and inserted in `settings.json` and `triggers.json` via mustache templates. Resolves
  [issue 371](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/371).
- Update a package dependency to resolve a security vulnerability.

## 5.4.0

- Triggers can now specify `activateRegions` which have the opposite effect of masks. If activateRegions are specified then the triggering
  object's bounding box must overlap with the activate region for the trigger to fire. Resolves [issue 384](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/384).

## 5.3.1

- File watching now works on Macs when the folder of images is a mounted network share. Resolves [issue 362](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/362).

## 5.3.0

- The `/originals` and `/annotations` folders can now be viewed via the webserver. This enables
  browsing the list of all stored images instead of having to know the specific filename of the
  image. Resolves [issue363](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/363).

## 5.2.1

- Address security vulnerability in webpack used during the build process. Resolves [issue 357](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/357).
- Address security vulnerability in the annotated image processing library. Resolves [issue 360](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/360).

## Version 5.2.0

- The original image that caused a trigger to fire is now stored temporarily and available for
  use via the built-in web server. The images are available in the `/originals` folder
  with the original filename. Resolves [issue 350](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/350).

## Version 5.1.2

- Address a low-severity security vulnerability in a 3rd party library. Resolves [issue 347](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/347).

## Version 5.1.1

- Relax the test for valid watchObject folders at startup. If the path has globs in it a warning will still get
  thrown but system startup will proceed. Resolves [issue 342](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/342).

## Version 5.1.0

- Warnings are now shown when `annotateImage` is `true` for a trigger handler but `enableAnnotations` wasn't set
  to `true` in the `settings.json` file. Resolves [issue 333](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/330).
- Log messages are printed on startup to help confirm the image folder was mounted correctly with Docker.
  Resolves [issue 330](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/330).
- Web server now shuts down properly when reloading settings. Resolves [issue 323](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/323).
- Startup is now re-attempted if there are any failures during launch. Each re-attempt is 30 seconds
  apart and five re-attempts will happen before things are assumed to just be completely broken.
  Resolves [issue 322](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/322).

## Version 5.0.0

### Breaking changes

- `statusTopic` can no longer be set on the mqtt configuration in `settings.json`. Overall status messages
  are always sent to the `node-deepstackai-trigger/status` topic. This change aligns the status topic messages
  with the new MQTT messages that the system listens to for resetting statistics.

### Non-breaking changes

- Per-trigger statistics are now sent in new MQTT messages published to the `node-deepstackai-trigger/statistics`
  topic. The trigger name, triggered count and analyzed file count are included, as well as a formatted string version suitable for presentation to a user. The per-trigger statistics are also available as variables for mustache templates.
  Resolves [issue 306](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/306).
- Statistics can be reset by publishing specific MQTT messages to the `node-deepstackai-trigger/statistics` topics
  and sub-topics. Resolves [issue 308](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/306).
- Statistics can be read and reset via new REST APIs. Overall statistics are available at `/statistics` and
  per-trigger statistics are available at `/statistics/triggerName`. Statistics for all triggers can be retrieved from
  `/statistics/all`. [See the API documentation for more information](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/REST-API). Resolves [issue 307](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/307) and [issue 311](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/311).
- Triggers can be activated by sending `node-deepstackai-trigger/motion` MQTT messages with the name of the trigger
  in the message. This is similar to activating a trigger via the REST API and results in the trigger attempting
  to download a snapshot from the `snapshotUri` specified in the trigger's configuration. Resolves [issue 314](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/291).
- Shutting down the system after a failed launch no longer throws an error. Resolves [issue 301](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/291).
- The underlying Linux variant used for the Docker image is now `node:slim`. Resolves [issue 299](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/291).
- Pushbullet is now included in the settings JSON schema. Resolves [issue 316](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/291).

## Version 4.0.0

### Breaking changes

- `settings.json` and `triggers.json` can no longer have unrecognized properties in them. While this is technically
  a breaking change it shouldn't impact anyone in practice. The addition of this requirement is to ensure new users
  get real-time notifications of typos/mistakes in their configuration files while editing in tools that support
  schema validation (such as Visual Studio Code). Resolves [issue 291](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/291).

### Non-breaking changes

- Pushbullet notifications are now supported as trigger handlers. Enable it in `settings.json` then add
  `pushbullet` handlers to your triggers in `triggers.json`. [See the wiki for more details](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-pushbullet-handlers). Resolves
  [issue 119](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/260).

## Version 3.1.0

- Triggers can now be manually activated via a REST API, and can be configured to retrieve a camera snapshot
  from a REST API instead of watching for image files that appear in a folder. This is useful for NVR systems
  other than BlueIris that don't support writing a snapshot automatically when motion is detected and can
  only call a REST API as the motion activated action. Resolves [issue 260](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/260).
- Occasional crashes when `enableAnnotations` is on are fixed. Resolves [issue 284](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/284).
- Requests to end the system (e.g. via ctrl+c) are handled gracefully now. Resolves [issue 280](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/280).
- Changes to `settings.json` and `triggers.json` are automatically detected and cause a reload. No need to restart
  the Docker container anymore! Just save the file and the system should notice the change and reload with the new
  configuration. Resolves [issue 278](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/278).
- The internal web server can now be enabled independently from annotated images using the
  `enableWebServer` setting. It's off by default, and enabled automatically when `enableAnnotations` is on for backwards compatibility reasons. Resolves [issue 265](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/265).

## Version 3.0.0

### Breaking changes

- Settings are now kept in a single `settings.json` file instead of separate ones for each handler. **You will need to create
  a `settings.json` file to use this release** and will need to **modify your Docker configuration** to mount the settings file
  either as a secret or have it present in your `/config` folder. A sample is included in the
  `sampleConfiguration` folder as a base to start from. It is essentially what was in the separate files previously now just merged
  into one file. Additionally all environment variables except for `TZ` are now just settings in this file. Any other environment
  variables for the trigger container can be removed from your Docker configuration.
- The source code repository's latest builds now produce out of the `main` branch. This means the location of the schema files
  has moved. If your `triggers.json` file has `master` in the `$schema` property you will need to update them
  to say `main` instead.

### Non-breaking changes

- All the schema file references are updated to reflect the new `main` branch name. Resolves [issue 255](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/247).
- The ability to disable verbose logging is back. Somehow between version 1.8.0 and now it broke. Resolves [issue 257](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/247).

## Version 2.2.0

- Setting the `retain` property in `mqtt.conf` to `true` makes all MQTT messages get sent with
  the retain flag on. Default is `false`. Resolves [issue 249](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/247).

## Version 2.1.1

- Fix an incorrect message at startup regarding annotations being enabled when they aren't.
  Resolves [issue 247](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/247).

## Version 2.1.0

- The length of time it takes to analyze an image is now calculated and available via the `analysisDurationMs` property in the default
  MQTT message. It is also available as a mustache template variable and shown in verbose logging messages. Resolves [issue 242](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/242).
- MQTT messages now include the trigger's name in the `name` property. Resolves [issue 243](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Configuration#enabling--configuring-pushover).
- Pushover is now supported as a trigger handler. See the wiki for [how to enable it](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Configuration#enabling--configuring-pushover) and [how to configure it on a trigger](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-pushover-handlers). Resolves [issue 232](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/232).
- Annotated images that show the objects and confidence percentage for things that fired the triggers are now available
  for Telegram messages. To enable the annotated image in Telegram messages set the new `annotateImage` property to true on
  the handler configuration. The annotated images are also exposed via a web server on port `4242` using their original file name
  for use by external services, for example `http://localhost:4242/Dog_20200523-075000.jpg`. By default the images are kept for 60 minutes before being deleted. This new capability comes with a performance impact due to the additional image manipulation required and is off by default. To enable it set the `ENABLE_ANNOTATIONS` environment variable on the trigger Docker container to true. Resolves [issue 187](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/191).
- Resolve a warning when using Telegram triggers. Resolves [issue 174](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/174).
- Added a new `CHOKIDAR_AWAITWRITEFINISH` environment variable that, when true,
  resolves issues with images getting saved to a network share that's then mounted
  to Docker as the image source. As this has a performance impact it is off
  by default. Resolves [issue 236](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/236).
- An optional `/node-deepstackai-trigger` mount point exists for future use. Resolves
  [issue 191](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/191).

## Version 2.0.0

### Breaking changes

- MQTT `online` and `offline` status messages are now sent when the service starts or fails
  to start. This, combined with the LWT message, makes it easy to set up MQTT binary sensors in Home Assistant
  to track the status of the system and send notifications to people if the system goes down
  or isn't running. **This is a breaking change if you rely on the LWT message**.
  The format of the offline message sent for the LWT changed to align with the online and processing status messages. [See the wiki for documentation on the status message format](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Configuration#enabling--configuring-mqtt). Resolves [issue182](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/182).
- webRequest URIs are no longer double-encoded. Instead only the text replaced with a
  mustache template is encoded. **This is a breaking change if you had previously modified your webRequest URIs to work
  around issue 176**. If you previously worked around the bug by removing encoding from the URIs in the trigger configuration
  file you will need to put the encoding in again. Resolves [issue 176](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/176).

### Other changes

- MQTT detection messages now include a friendly formatted version of the predictions,
  for example: `"formattedPredictions": "dog (98%)"`. Resolves [issue 181](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/181).
- Failed calls to the Deepstack server no longer throw an unhandled promise rejection
  exception. Resolves [issue 175](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/175).

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
