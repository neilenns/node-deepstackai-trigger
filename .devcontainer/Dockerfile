# Install necessary additional things via a Dockerfile so they are there before VSCode tries to do things
# This is most important for git: if git is installed via postCreateCommand it actually isn't there in
# time for first container creation. VSCode will attempt to copy the .gitconfig file and fail
# because git isn't installed
FROM node:alpine

ENV CHOKIDAR_USEPOLLING=true
RUN apk --no-cache update && apk --no-cache upgrade && apk --no-cache add tzdata && apk --no-cache add git