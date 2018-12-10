
# PROFYLE Portal

This repository contains the code to run both the profyle node servers and the
profyle portal front-end.


## Installation

```sh
wget https://raw.githubusercontent.com/PROFYLE-TFRI/portal/master/install.sh
chmod +x ./install.sh
./install.sh # [optional installation directory] (default: ~/profyle-portal)
```

You will be prompted for configuration details. A `config.js` file will be created
with your configuration details.


## Running

```sh
npm start # or ./bin/start-profyle
```


## Commands

| Command | Description |
| --- | --- |
| `npm start` | Starts the application (`./bin/start-profyle`) |
| `node scripts/generate-api-key.js` | Regenerates an API key and update `config.js` |
| `node scripts/parse-profyle-csv.js [input csv] [output dir]` | Creates a profyle data directory from CSV data |
| `node scripts/install.js` | Prompts questions to create a `config.js` |
| `npm run build` | Builds the portal front-end |
| `npm run watch:server` | Runs the server and restarts it on every change (excludes frontend) |
| `npm run watch:all` | Runs the server and restarts it on every change (includes frontend) |
| `npm run watch:frontend` | Starts the webpack dev server |



## Development

On two separate terminals, run:

```sh
npm run watch:server
```
```sh
npm run watch:frontend
```

## Run as a service

To run the application as a systemd service, you can place the following file at
`/etc/systemd/system/profyle.service` (replace `$INSTALL_DIRECTORY`), and start
the service with `sudo systemctl start profyle`.

```ini
[Unit]
Description=Profyle Portal Server
After=network.target

[Service]
Environment=NODE_ENV=production 
Environment=PORT=80
ExecStart=/usr/bin/node $INSTALL_DIRECTORY/bin/start-profyle
Restart=always
SyslogIdentifier=profyle
User=root
Group=root

TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```
