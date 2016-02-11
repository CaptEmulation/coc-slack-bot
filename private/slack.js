var winston = require('winston');
var config = require('../config');
var Slack = require('slack-client');
var clashApi = require('clash-of-clans-api');
var model = require('./model');
var _ = require('underscore');
var Parser = require('./parser').Parser;
var Player = model.Player;
var WarEvent = model.WarEvent;

function forText(text) {
  var dsl = {
    withCommand: function (commandName) {
      var commandDsl = {
        isCommand: function () {
          return text.toLowerCase().indexOf(commandName) === 0;
        },
        hasCommand: function () {
          return text.toLowerCase().indexOf(commandName) !== -1;
        },
        eat: function (message) {
          if (commandDsl.isCommand(message)) {
            message.text = message.text.slice(commandName.length);
          }
          return message;
        }
      };
      return commandDsl;
    }
  };
  return dsl;
}

function forMessage(message) {
  var text = message.text;
  return _.extend({
    getFirstWord: function () {
      return text.split(' ')[0];
    }
  }, forText(text));
}

function createPlayer() {
  var createPlayerFunc = _.extend(function (slack, message) {
    var playerName = message.text.split(' ')[1];
    var channel = slack.getChannelGroupOrDMByID(message.channel);
    Player.findOne({
      name: playerName.toLowerCase()
    }, function (err, player) {
      if (err) {
        channel.send('Something went wrong! ' + JSON.stringify(err));
        return;
      }
      if (!player) {
        console.log('Creating user ' + playerName);
        var model = new Player({
          name: playerName.toLowerCase()
        });
        return model
          .save(function (err) {
            if (err) {
              channel.send('Something went wrong! ' + JSON.stringify(err));
              return;
            }
            console.log('saved ',  model.toJSON());
            channel.send(playerName + ' created');
          });
      }
      channel.send(playerName + ' already exists.');
    });
  }, {
    on: ['player', function (word) { return ''; }],
    verbs: ['create']
  });

}

var commands = {
  clashbot: {
    create: {
      player: function (slack, message) {

      }
    },
    player: function (slack, message) {
      var messageHelper = forMessage(message);
      var slackHelper = forSlack(slack);
      var name = messageHelper.getFirstWord().toLowerCase();
      var channel = slack.getChannelGroupOrDMByID(message.channel);

      Player.findOne({
        name: name
      }, function (err, player) {
        if (err) {
          channel.send('Something went wrong! ' + JSON.stringify(err));
          return;
        }

        slackHelper.forCommands({
          attacked: function (slack, message) {
            var words = message.text.split(' ');
            var stars, base;
            var description = words.reduce(function (description, word) {
              var num = parseInt(word, 10);
              if (/^[0123]s$/.test(word)) {
                stars = parseInt(word.charAt(0), 10);
              } else if (num !== NaN) {
                base = num;
              } else {
                description.push(word);
              }
              return description;
            }, []).join(' ');
            var errors = [];
            if (!stars) {
              errors.push('I did not catch how many stars');
            }

            if (!base) {
              errors.push('what base was attacked');
            }

            if (!description) {
              errors.push('there really should be a description');
            }

            if (errors.length) {
              channel.send('Sorry, but ' + errors.join(', also ') + ' otherwise I can\'t record ' + name + '\'s attack correctly');
              return;
            }

            var warEvent = new WarEvent({
              player: name,
              enemyPos: base,
              description: description,
              stars: stars
            });
            warEvent.save(function (err) {
              if (err) {
                channel.send('Something went wrong! ' + JSON.stringify(err));
                return;
              }

              channel.send('Got it, ' + name + ' won ' + stars + ' stars against ' + base + ' with ' + description + 'attack');
            });
            return true;
          }
        }).execute(messageHelper.eat(message));
      });
      return true;
    },
    war: {
      start: function (slack, message) {

      },
      end: function (slack, message) {

      },
      stats: function (slack, message) {

      }
    }
  }
};

function forSlack(slack) {
  var dsl = {
    forCommands: function (commands) {
      var commandDsl = {
        execute: function (message) {
          var text = message.text;
          console.log('executing command: ' + text + ' for command: ' + forMessage(message).getFirstWord());
          Object.keys(commands).forEach(function (commandName) {
            var index = text.toLowerCase().indexOf(commandName);
            if (index === 0) {
              var command = commands[commandName];
              console.log('parsing word ' + commandName);
              console.log('command: ' + JSON.stringify(command, null, 2));
              message.text = message.text.slice(commandName.length);
              console.log('message text: ' + message.text);
              if (_.isFunction(command) && !command(slack, message) || _.isObject(command)) {
                console.log('diving in');
                dsl.forCommands(command).execute(message);
              }
            }
          });
          return commandDsl;
        }
      };
      return commandDsl;
    }
  };
  return dsl;
}

function connect(app) {
  var logger = app.logger;
  var token = config.slack.token;
  var autoReconnect = true; // Automatically reconnect after an error response from Slack.
  var autoMark = true; // Automatically mark each message as read after it is processed.
  var slack = new Slack(token, autoReconnect, autoMark);
  var coc = clashApi({
    token: config.coc.token
  });

  var clashbotParser = new Parser({
    activates: 'clashbot',
    verbs: [
      {
        words: ['hello', 'hey', 'hi'],
        handler: function (req, res) {
          res.send('Hi <@' + req.user + '>');
        }
      },
      {
        words: ['rank'],
        handler: function (req, res) {
          coc
            .clanMembersByTag('#UPC2UQ')
            .then(function (response) {
              var response = _.chain(response.items)
                .sortBy('clanRank')
                .map(function (member) {
                  return member.name + ' has ' + member.trophies + ' trophies and ' + member.donations + ' donations'
                })
                .join('\n')
                .value();
              res.send(response);
            });
        }
      },
      {
        words: ['info', 'get info'],
        handler: function (req, res) {
          var name = req.words.rest();
          coc
            .clanMembersByTag('#UPC2UQ')
            .then(function (response) {
              var members = _.filter(response.items, function (member) {
                return member.name.toLowerCase() === name.toLowerCase();
              });
              var member = members[0];
              if (member) {
                res.send(name + ' has ' + member.trophies + ' trophies and ' + member.donations + ' donations');
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        }
      }
    ]
  });


  slack.on('open', function slackopen() {
    logger.debug('Connected to ' + slack.team.name + ' as @' + slack.self.name);
  });

  slack.on('message', function onSlackMessage(message) {
    //forSlack(slack).forCommands(commands).execute(message);
    clashbotParser.parse({
      message: message.text,
      user: message.user
    },
    {
      send: function (response) {
        var channel = slack.getChannelGroupOrDMByID(message.channel);
        channel.send(response);
      }
    });
  });

  slack.on('error', function onSlackError(err) {
    logger.error(err);
  });

  slack.login();

  return slack;
}

exports.connect = connect;