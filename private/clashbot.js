var clashApi = require('clash-of-clans-api');
var config = require('config');
var Parser = require('./parser').Parser;
var _ = require('underscore');
var Promise = require('bluebird');
var fuzzy = require('fuzzy');
var debug = require('debug')('clashbot');

var coc = clashApi({
  token: config.coc.token
});

var clanTags = config.clanTags;

function getClanTagFromName(name) {
  return name && name.length && clanTags[name] || clanTags.default;
}

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
    words: ['hero rank', 'hero', 'heroes'],
    handler: function (req, res) {
      var clan = req.words.rest().toLowerCase();
      var tag = getClanTagFromName(clan);
      Promise.all(_.chain(clanTags).mapObject(function (tag) {
        return coc
          .clanMembersByTag(tag)
          .then(function (r) {
            return r.items;
          });
      }).values().value())
        .then(function (responses) {
          return _.union.apply(_, responses);
        })
        .then(function (responses) {
          return Promise.map(_.pluck(responses, 'tag'), function (playerTag) {
            return coc
              .playerByTag(playerTag);
          }, { concurrency: 2 });
        })
        .then(function (players) {
          var response = _.chain(players)
            .sortBy(['townHallLevel', 'name'])
            .map(function (player) {
              var line =  player.name + ' (TH' + player.townHallLevel + ') ';
              player.heroes.forEach(function (h) {
                line += h.name + '(' + h.level + ') ';
              });
              line += 'total: ' + _.reduce(_.pluck(player.heroes, 'level'), function (sum, val) {
                return sum += val;
              }, 0);
              return line;
            })
            .join('\n')
            .value();
          res.send(response);
        });
    }
  },
  {
    words: ['rank'],
    handler: function (req, res) {
      var clan = req.words.rest().toLowerCase();
      var tag = getClanTagFromName(clan);

      coc
        .clanMembersByTag(tag)
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
      Promise.all(_.chain(clanTags).mapObject(function (tag) {
        return coc
          .clanMembersByTag(tag)
          .then(function (r) {
            return r.items;
          });
      }).values().value())
        .then(function (responses) {
          var flattened = _.union.apply(_, responses);
          var members = flattened.filter(function (member) {
            return member.name.toLowerCase() === name.toLowerCase();
          });
          if (members.length) {
            var member = members[0];
            res.send(name + ' has ' + member.trophies + ' trophies and ' + member.donations + ' donations');
          } else {
            var fuzzyMembers = fuzzy.filter(name, _.pluck(flattened, 'name')).map(function(el) { return el.string; });
            if (fuzzyMembers.length > 1) {
              res.send('Did you mean ' + fuzzyMembers.join(' or ') + '?');
            } else if (fuzzyMembers.length === 1) {
              var member = flattened.filter(function (member) {
                return member.name.toLowerCase() === fuzzyMembers[0].toLowerCase();
              })[0];
              res.send(member.name + ' has ' + member.trophies + ' trophies and ' + member.donations + ' donations');
            }
          }
        })
        .catch(function (err) {
          debug('Error getting play name', name);
          debug(err);
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
