# Install necessary additional things via a Dockerfile so they are there before VSCode tries to do things
# This is most important for git: if git is installed via postCreateCommand it actually isn't there in
# time for first container creation. VSCode will attempt to copy the .gitconfig file and fail
# because git isn't installed
FROM node:alpine

USER root
RUN apk --no-cache update && apk --no-cache upgrade && apk --no-cache add tzdata && apk --no-cache add git

ARG NPM_GLOBAL=/usr/local/share/npm-global
ARG USERNAME=node

# Set up the npm install directory so it works with the "node" user
RUN mkdir -p ${NPM_GLOBAL} \
    && chown ${USERNAME}:root ${NPM_GLOBAL} \
    && npm config -g set prefix ${NPM_GLOBAL}

# Create the vscode workspace and .git folder and set the owner to
# the node user so git commands work
RUN mkdir -p /workspace/.git && chown -R node:node /workspace/.git

ENV CHOKIDAR_USEPOLLING=true
USER node