# This temporary image is used to produce the build.
FROM node:12 as build
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

# Pre-create the temporary storage folder so it has the right user
# permissions on it after volume mount
RUN mkdir -p /node-deepstackai-trigger && chown -R node:node /node-deepstackai-trigger
RUN mkdir -p /home/node/app/public && chown -R node:node /home/node/app/public

WORKDIR /home/node/app
USER node
COPY --from=build --chown=node:node /home/node/app/dist/bundle.js .
COPY --from=build --chown=node:node /home/node/app/README.md .
COPY --from=build --chown=node:node /home/node/app/LICENSE .
COPY --from=build --chown=node:node /home/node/app/FONT_LICENSE .
COPY --from=build --chown=node:node /home/node/app/fonts/CascadiaCode.ttf ./fonts/CascadiaCode.ttf

# The static files for directory display by the Express web server need to get copied over.
COPY --from=build --chown=node:node /home/node/app/node_modules/serve-index/public ./public

# Enable polling for watching files by default since it appears that's
# the only way to have file detection work in a Docker container.
# This can always be set to false in docker-compose.yml later if necessary.
ENV CHOKIDAR_USEPOLLING=true

ENTRYPOINT [ "node", "--no-deprecation", "bundle.js" ]