var ES5Class = require('es5class');
var _ = require('underscore');
var Schema = require('mongoose').Schema;
var ObjectId = Schema.Types.ObjectId;
var util = require('util');
require('mongoose').Promise = require('q').Promise;


var War = function () {
  Schema.apply(this, arguments);
  this.add({
    dateStarted: Date,
    enemyTeam: String,
    enemyGuildLevel: Number,
    participants: Array
  });
};

util.inherits(War, Schema);

var Player = function () {
  Schema.apply(this, arguments);
  this.add({
    dateJoined: Date,
    name: String,
    thLevel: Number,
    publicComment: String,
    leaderComment: String,
    status: String
  });
};

util.inherits(Player, Schema);

var WarEvent = function () {
  Schema.apply(this, arguments);
  this.add({
    war: ObjectId,
    player: String,
    teamPos: Number,
    enemyPos: Number,
    enemyThLevel: Number,
    description: String,
    stars: Number,
    newStars: Number,
    note: String,
    attackNumber: Number
  })
};

util.inherits(WarEvent, Schema);

exports.get = function (model) {
  return exports[model];
};


exports.install = function (db) {
  function install(name, Schema) {
    exports[name] = db.model(name, new Schema());
  }

  install('War', War);
  install('Player', Player);
  install('WarEvent', WarEvent);
}
