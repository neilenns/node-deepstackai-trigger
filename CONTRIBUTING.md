# Contributing to node-deepstackai-trigger

Contributions are welcome to the project, either via feature requests, issue reports, or pull requests. Note that feature requests may take a while to get to 😂

The project was designed from the start to be easy to clone and run to simplify experimenting and
trying out different changes. There's nothing worse than coming across a nifty project on GitHub
only to spend hours fighting with various dependencies to get it working.

If you would like to contribute changes to the repo please start by assigning the issue to yourself
in github. Good issues for first time contributors are tagged accordingly in the issues list. Don't
forget to read the [opening pull requests](#opening-pull-requests) guidelines below.

## Seting up the project

The setup takes less than five minutes if you use [Visual Studio Code](http://code.visualstudio.com/)
and the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

Here's what to do:

1. Make sure you have Docker installed (you likely already do if you found this repo)
2. Clone the repo
3. Open the folder in Visual Studio Code
4. When prompted re-open the folder in a Dev Container

That's it. If you press F5 to start debugging it should launch everything and start spitting out log
messages in the output window. The errors about not being able to connect to a web address are
expected in the development environment (see issue [#10](https://github.com/danecreekphotography/node-deepstackai-trigger/issues/10)
if you'd like to help make those go away.)

If you are on Windows you'll need to be running Windows Subsystem for Linux 2 before this
all works. Until that's available in the public release in late May you'll need to
install the [Insiders Slow Ring](https://docs.microsoft.com/en-us/windows/wsl/wsl2-index) build. This does work, as it's how the
entire project was initially written and tested.

Note that while you may be tempted to try and open this project using the _Remote-Containers: Open Repository in Container_
command it won't work as the extnesion doesn't currently support docker-compose.yml-based projects.

## Opening pull requests

Feel free to open pull requests but please keep the following in mind:

- All pull requests must reference an issue
- All pull requests must be made from a feature branch, not master
- If your change touches anything under the `src/` directory or the `README.md` file the version number
  must get bumped by running `npm version`. New features should be a minor release increment. Bug fixes
  should be a patch release increment.
- Pull requests must pass the automatic Docker and node.js build checks
- The repo is set up to auto-apply Prettier, ESLint, Markdownlint rules, and import ordering rules. If you're using VS Code
  in a dev container the necessary extensions will automatically be installed to keep this clean prior to opening the pull
  request.
