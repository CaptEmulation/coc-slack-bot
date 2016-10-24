# WARNING

This code is highly experimental, and is under development.  Use with caution.

# Setup

## Requirements

### Software

 - Node
 - Mongo

### Services

 - Static IP
 - [Clash of Clans developer API token](developer.clashofclans.com)
 - [Slack bot integration token](api.slack.com/tokens)

## Configuration

# Intall

1. Clone this repo.
1. `npm install`
1. `cp config.js.example config.js`
1. Modify `config.js` for your system.
1. `npm update`

# Execution

`npm start`

# Testing

What little unit tests there are: `npm test`

Go to slack and open up a direct message with name of the slashbot you created.  Type the name of the clashbot and hi, e.g. `clashbot hi`.  If the bot responds then the slack integration is working.  

Next type the name of the slack bot and rank, e.g. `clashbot rank` and you should see a list of the members of the clan sorted by rank with donation and trophy details.  This means the clash of clans api integration is working.

I don't have the parsing and back-end logic fully built for war tracking.  That's what the database (mongo) is for that is set-up but otherwise unused.
