# This temporary image is used to produce the build.
FROM node:slim as build
RUN mkdir -p /home/node/app/fonts && chown -R node:node /home/node/app

WORKDIR /home/node/app
COPY package*.json ./
USER node
# These have to copy before npm ci because npm ci runs tsc
COPY --chown=node:node . .
RUN npm ci --no-optional
RUN npm run webpack

# This is the final production image
FROM node:slim

RUN RUN apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev

# Pre-create the temporary storage folder so it has the right user
# permissions on it after volume mount
RUN mkdir -p /node-deepstackai-trigger && chown -R node:node /node-deepstackai-trigger

WORKDIR /home/node/app
USER node
COPY --from=build --chown=node:node /home/node/app/dist/bundle.js .
COPY --from=build --chown=node:node /home/node/app/README.md .
COPY --from=build --chown=node:node /home/node/app/LICENSE .
COPY --from=build --chown=node:node /home/node/app/FONT_LICENSE .
COPY --from=build --chown=node:node /home/node/app/fonts/CascadiaCode.ttf ./fonts/CascadiaCode.ttf

# Enable polling for watching files by default since it appears that's
# the only way to have file detection work in a Docker container.
# This can always be set to false in docker-compose.yml later if necessary.
ENV CHOKIDAR_USEPOLLING=true

ENTRYPOINT [ "node", "--no-deprecation", "bundle.js" ]