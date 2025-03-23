# Team-Firetruck: Discord Bot

Team Firetruck's COS 420 working repository for the VibeCheque Discord Bot. Also see the [repository](https://github.com/COS420-Fall24/Team-F/tree/main) for the landing page.

## Installation Process

1. Download this repository, either using [this ZIP](https://github.com/COS420-Fall24/VibeCheque/archive/refs/heads/main.zip) or by running `git clone git@github.com:COS420-Fall24/VibeCheque.git` if git is installed.
2. If Node.js is installed, navigate to the repository's directory and run `npm install`. If Node.js is not installed, it can be downloaded [here](https://nodejs.org/en/download/prebuilt-installer/current).
3. You'll need to set some environment variables for this bot to connect to the Discord API. If you don't know what these are, be sure to make a bot using the Discord Developer Portal. Fill out the details in `.env.example` and rename the file `.env`.

## Running

Once the [Installation Process](#installation-process) is complete, run `npm run registerCommands` to allow users to access the bot's commands. This task is only necessary once, unless a command has been added, removed, or its description/format has been changed. The console should print
```
> vibecheque@0.0.2 registerCommands
> npm run build && node build/registerCommands.js


> vibecheque@0.0.2 build
> npx tsc && npx tsc-alias

refreshing commands
reloaded commands
```

To run the bot, simply run `npm start` and the following text should print to console:
```

> vibecheque@0.0.2 start
> npm run build && node build/index.js


> vibecheque@0.0.2 build
> npx tsc && npx tsc-alias

(node:1546482) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
client "ready": Logged in as VibeCheque#4991!
```