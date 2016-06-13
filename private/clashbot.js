var clashApi = require('clash-of-clans-api');
var config = require('../config');
var Parser = require('./parser').Parser;
var _ = require('underscore');

var coc = clashApi({
  token: config.coc.token
});


var verbs = [
  {
    words: ['hello', 'hey', 'hi'],
    handler: function (req, res) {
      res.send('Hi <@' + req.user + '>');
    },
    help: 'Say hello.'
  },
  {
    words: ['strat', 'strategy'],
    handler: function (req, res) {
      res.send(
        'Top three players attack top six or wait until end of war to do clean-up.  Bottom five players attack their mirror at start of war and do their second attack ASAP.  Everyone else drops five spots for first attack.  Bottom five are reserved for two hours and all other bases are reserved for first eight hours.  For second attack, attack smart, get three stars, and generally attack bottom-up.  Players which deviate from this strategy will be left out of wars, demoted or kicked.'
      );
    },
    help: 'Explain the current war strategy'
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
    },
    help: 'Show the rankings for the clan'
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
    },
    args: 'player name',
    help: 'Show stats for the player'
  }
];

verbs.push((function () {
  var verbHelp = verbs.map(function (verb) {
      var help = '["' + verb.words.join('", "') + '"] ';
      if (verb.args) {
        help += '[' + verb.args + ']';
      }
      help += ' - ' + verb.help;
      return help;
    })
    .join('\n');

  return {
    words: ['help', 'what'],
    handler: function (req, res) {
      res.send(verbHelp);
    },
    help: 'that\'s just silly'
  };
}()));

var clashbotParser = new Parser({
  activates: 'clashbot',
  verbs: verbs
});

module.exports = clashbotParser;