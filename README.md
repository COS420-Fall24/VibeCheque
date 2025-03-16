# Team-Firetruck: Discord Bot

# test

Team Firetruck's COS 420 working repository for the VibeCheque Discord Bot. Also see the [repository](https://github.com/COS420-Fall24/Team-F/tree/main) for the landing page.

## Installation Process

1. Download this repository, either using [this ZIP](https://github.com/COS420-Fall24/VibeCheque/archive/refs/heads/main.zip) or by running `git clone git@github.com:COS420-Fall24/VibeCheque.git` if git is installed.
2. If Node.js is installed, navigate to the repository's directory and run `npm install`. If Node.js is not installed, it can be downloaded [here](https://nodejs.org/en/download/prebuilt-installer/current).
3. You'll need to set some environment variables for this bot to connect to the Discord API. If you don't know what these are, be sure to make a bot using the Discord Developer Portal. Fill out the details in `.env.example` and rename the file `.env`.

## Running

Once the [Installation Process](#installation-process) is complete, run `npm start` to launch the bot. you should see terminal output that looks something like this:
```
> vibecheque@0.0.1 start
> npx tsc --outDir build && node --es-module-specifier-resolution=node build/index.js

refreshing commands
reloaded commands
client "ready": Logged in as VibeCheque#4991!
```