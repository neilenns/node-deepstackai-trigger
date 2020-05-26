# DeepStack AI Triggers

A Docker container that runs [DeepStack AI](https://deepstack.cc/) to process images from a watch
folder and then fire web request calls and/or MQTT eventsif the image matches a defined list of
triggers.

While general purpose the idea behind this service draws inspiration from a C# desktop application
by GentlePumpkin on [ipcamtalk.com](https://ipcamtalk.com/threads/tool-tutorial-free-ai-person-detection-for-blue-iris.37330/)
that uses BlueIris video survelliance software to grab images when motion is detected, processes
the images using DeepStack, and then triggers video recording if the image matches certain parameters.
While the C# application is nifty it was difficult to install as a service and only ran on Windows.

## General installation guidelines

- Copy the `docker-compose.yml`, `mqtt.json` and `triggers.json` files from the
  `sampleConfiguration` directory locally.
- Edit the `docker-compose.yml` file to modify the mount point for source images, set the timezone
  and optionally enable MQTT.
- Edit `mqtt.json` to specify the connection information for your MQTT server (if using MQTT).
- Edit `triggers.json` to define the triggers you want to use. See the [defining triggers](#Defining triggers)
  section below for details on supported values.

Setting the timezone via the `TZ` environment variable in `docker-compose.yml` is important for
every thing to work smoothly. By default Docker containers are in UTC and that messes up
logic to skip existing images on restart. A list of valid timezones is available on
[Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). Use any value
from the `TZ database name` column.

Editing the .json files in [Visual Studio Code](https://code.visualstudio.com/) or some other editor
that understands JSON Schemas is recommended: you'll get full auto-complete and documentation as
you type.

After modifying the configuration files run `docker-compose up -d` and everything should
spin up and work. Use your Docker client to review log messages from the `trigger`
container: there's ample logging to help track down any configuration errors that
may exist.

## Defining triggers

The trigger.conf file is used to define a list of triggers that fire when certain AI detection
parameters are met. Triggers, when fired, can call a web request URL or send an MQTT event (or both!).

In the case of using this to make BlueIris start recording the web request URL is the way to go.
MQTT is useful if you want to do fancier automation based on the detected objects.

A sample file to start from is included in the _sampleConfiguration/triggers.json_ folder. As mentioned
above you'll have a happier time editing the trigger configuration if you use a text editor that supports
real-time schema validation (like as Visual Studio Code).

| Property     | Description                                                                                                                                                                                                                                                                                                                            | Example                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| name         | Required. A name for the trigger. This is shown in the logs.                                                                                                                                                                                                                                                                           | "Front door camera"         |
| watchPattern | Required. A wildcard pattern that determins which images are processed by this trigger. For Blue Iris use this will be something like "/images/FrontDoorSD\*.jpg". By default the image folder is mounted to _/images_ so unless you mounted the image folder elsewhere for some reason all watchPatterns should start with _/images_. | "/images/FrontDoorSD\*.jpg" |
| watchObjects | Required. An array of object types that the trigger watches for. The list of supported objects is available in the [DeepStack AI documentation](https://nodejs.deepstack.cc/object-detection) however the most useful are: "person", "car", "truck", "dog", "bear"                                                                     | ["car", "truck", "person"]  |
| handlers     | Required. A list of handlers that get called when the trigger fires. Currently [webRequest](#defining_webrequest_handlers) and [mqtt](#defining_mqtt_handlers) handlers are supported.                                                                                                                                                 |
| enabled      | Optional. Default true. When set to false the trigger will be ignored.                                                                                                                                                                                                                                                                 | false                       |
| threshold    | Optional. A minimum and maximum threshold that must be satisifed for the trigger to fire. See [defining trigger thresholds](#defining_trigger_thresholds) for more information.                                                                                                                                                        |                             |

### Defining trigger thresholds

The trigger threshold can help fine tune how sensitive the trigger is to detected objects. It is
optional and suggested to omit until you've looked at some of the output logs to see which
triggers need adjusting.

| Property | Description                                                                                                                         | Example |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------- |
| minimum  | Optional. Default 0. A value between 0 and 100 that determines the minimum label confidence level required to activate the trigger. | 50      |
| maximum  | Optional. Default 100. A value between 0 and 100 that determines the maximum confidence level allowed to activate the trigger.      | 90      |

### Defining webRequest handlers

A webRequest handler calls a web URI any time the trigger is fired. In the BlueIris use case this is how to define the URI that tells Blue Iris to start recording the HD camera.

| Property    | Description                                                | Example                                                                          |
| ----------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| triggerUris | Required. An array of URIs to call when the trigger fires. | "http://localhost:81/admin?trigger&camera=FrontDoorHD&user=username&pw=password" |

### Defining mqtt handlers

An mqtt handler sends an MQTT event any time the trigger is fired. The event includes an array of all the predictions
that matched the trigger configuration, making it easy to do advanced automation based on the specific detected objects.

| Property | Description                                          | Example                      |
| -------- | ---------------------------------------------------- | ---------------------------- |
| topic    | Required. The topics to post when the trigger fires. | "aimotion/trigger/FrontDoor" |

Here is an example of the data sent in the message:

```javascript
[
  {
    confidence: 0.99903184,
    label: "person",
    y_min: 57,
    x_min: 164,
    y_max: 363,
    x_max: 347,
  },
];
```

## Configuring MQTT

MQTT is enabled by uncommenting the `- mqtt` line in the `docker-compose.yml` file. See the comment above
the line in the file to be sure the right line is changed.

MQTT is configured using the `mqtt.conf` file. The following properties are supported:

| Property | Description                                         | Example                     |
| -------- | --------------------------------------------------- | --------------------------- |
| uri      | Required. The address of the MQTT server.           | "http://192.168.1.100:1883" |
| username | Optional. The username to log into the server with. | "mqttuser"                  |
| password | Optional. The password to log into the server with. | "mqttpass"                  |

The only authentication method currently supported is basic.

## Building this yourself

Interested in building this locally? Check out the [CONTRIBUTING.md](CONTRIBUTING.md) guide
for quick steps on how to clone and run in under five minutes.
