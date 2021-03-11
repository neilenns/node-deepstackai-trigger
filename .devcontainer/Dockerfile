# Install necessary additional things via a Dockerfile so they are there before VSCode tries to do things
# This is most important for git: if git is installed via postCreateCommand it actually isn't there in
# time for first container creation. VSCode will attempt to copy the .gitconfig file and fail
# because git isn't installed
FROM node:12

ARG NPM_GLOBAL=/usr/local/share/npm-global
ARG USERNAME=node

RUN apt-get update && apt-get install -y git

# Set up the npm install directory so it works with the "node" user
RUN mkdir -p ${NPM_GLOBAL} \
    && chown ${USERNAME}:root ${NPM_GLOBAL} \
    && npm config -g set prefix ${NPM_GLOBAL}

# Create the vscode workspace and .git folder and set the owner to
# the node user so git commands work
# Create the local storage folder and set ownership of it so once a volume
# is mounted there the permissions are correct
RUN mkdir -p /workspace/.git \
    && mkdir -p /node-deepstackai-trigger \
    && chown -R ${USERNAME}:${USERNAME} /workspace/.git \
    && chown -R ${USERNAME}:${USERNAME} /node-deepstackai-trigger

ENV CHOKIDAR_USEPOLLING=true
USER node