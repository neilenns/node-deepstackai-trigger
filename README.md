# DeepStack AI Triggers

A Docker container that runs [DeepStack AI](https://deepstack.cc/) to process images from a watch
folder and then fire web request calls and/or MQTT eventsif the image matches a defined list of
triggers.

While general purpose the idea behind this service draws inspiration from a C# desktop application
by GentlePumpkin on [ipcamtalk.com](https://ipcamtalk.com/threads/tool-tutorial-free-ai-person-detection-for-blue-iris.37330/)
that uses BlueIris video survelliance software to grab images when motion is detected, processes
the images using DeepStack, and then triggers video recording if the image matches certain parameters.
While the C# application is nifty it was difficult to install as a service and only ran on Windows.

## General installation guidelines (more to come)

- Copy the `docker-compose.yml`, `mqtt.json` and `triggers.json` file locally
- Edit the `docker-compose.yml` file to modify the mount point for source images, set the timezone
  and optionally enable MQTT
- Edit `mqtt.json` to specify the connection information for your MQTT server
- Edit `triggers.json` to define the triggers you want to use

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

## Building this yourself

Interested in building this locally? Check out the [CONTRIBUTING.md](CONTRIBUTING.md) guide
for quick steps on how to clone and run in under five minutes.
