# DeepStack AI Triggers

[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/danecreekphotography/node-deepstackai-trigger)

This system uses Docker containers to run [DeepStack AI](https://deepstack.cc/) and process images
from a watch folder, then fires a set of registered triggers to make web request calls, send MQTT
events, and send Telegram messages when specified objects are detected in the images.

This project was heavily inspired by GentlePumpkin's post on [ipcamtalk.com](https://ipcamtalk.com/threads/tool-tutorial-free-ai-person-detection-for-blue-iris.37330/)
that triggers BlueIris video survelliance using DeepStack as the motion sensing system.

## Quick start - basic web requests

The following five steps are all that's required to start using AI to analyze images and
then call a web URL, e.g. triggering a [BlueIris camera](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Integrating-with-BlueIris) to record.

1. Install [Docker](http://www.docker.com/)
2. Copy the `docker-compose.yml`, `settings.json` and `triggers.json` files from the [sampleConfiguration](https://github.com/danecreekphotography/node-deepstackai-trigger/tree/master/sampleConfiguration) directory locally.
3. Edit the `docker-compose.yml` file to modify the mount point for source images and set the timezone.
4. Edit `triggers.json` to [define the triggers](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers) you want to use.
5. Run `docker-compose up` from within the folder that contains your `docker-compose.yml` file to start the system running.

Setting the timezone via the `TZ` environment variable in `docker-compose.yml` is important for
every thing to work smoothly. By default Docker containers are in UTC and that messes up
logic to skip existing images on restart. A list of valid timezones is available on
[Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). Use any value
from the `TZ database name` column.

Editing the .json files in [Visual Studio Code](https://code.visualstudio.com/) or some other editor
that understands JSON schemas is recommended: you'll get full auto-complete and documentation as
you type.

Having trouble? Check the logs output from Docker for any errors the system may throw.
The [troubleshooting](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Troubleshooting)
page has tips for resolving common deployment problems.

## Quick start - enabling MQTT, Pushbullet, Pushover and Telegram

To enable the different push notifications handlers:

1. Edit `settings.json` to specify [specify the connection information](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Configuration#) for the service.
2. Edit `triggers.json` to add [mqtt](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-mqtt-handlers), [Pushbullet](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-pushbullet-handlers), [Pushover](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-pushover-handlers), or [Telegram](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers#defining-telegram-handlers) handlers.

## Learning more

The [project wiki](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki) has complete documentation on:

- [Configuring the system](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Configuration)
- [Defining triggers](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Defining-triggers)
- [Deploying to Synology or Unraid](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Deploying-to-Synology-and-Unraid)
- [Integrating with BlueIris](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Integrating-with-BlueIris)
- [Integrating with HomeAssistant](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Integrating-with-HomeAssistant)
- [Troubleshooting](https://github.com/danecreekphotography/node-deepstackai-trigger/wiki/Troubleshooting)

## Supported Docker image tags

The following tags are available in the [repository](https://github.com/neilenns/ambientweather2mqtt/pkgs/container/ambientweather2mqtt):

| Tag name    | Description                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `latest`    | The latest released build.                                                                                                 |
| `<version>` | The specific [released version](https://github.com/danecreekphotography/node-deepstackai-trigger/releases), e.g. `v1.5.0`. |


## To manually publish docker image under your own docker repository

Build the docker image locally, by running these commands in the root of the project directory:

* First let us log in to docker hub
```shell
   docker login -u <username>
```

* build a local image of the app
```shell
   docker build . --file Dockerfile --tag node-deepstackai-trigger:<your-version-number>
```

* tag the local image with your dockerhub repository
```shell
   docker tag node-deepstackai-trigger:<your-version-number> <docker-hub-user-name>/node-deepstackai-trigger:<your-version-number>
```

* publish the image to docker hub as tagged
```shell
   docker push <docker-hub-user-name>/node-deepstackai-trigger:<your-version-number>
```
