var _ = require('underscore');
var Promise = require('q').Promise;

function WordList(words) {
  if (_.isString(words)) {
	  words = words.split(' ');
  }

  this._words = Array.isArray(words) ? words : [];
}

_.extend(WordList.prototype, {
  first: function () {
    return this._words[0];
  },
  last: function () {
    return this._words.length && this._words[this._words.length - 1];
  },
  pullFirst: function () {
    return this._words.splice(0, 1)[0];
  },
  words: function () {
    return this._words;
  },
  rest: function () {
    return this._words.join(' ');
  },
  contains: function (word) {
    return this._words.indexOf(word) != -1;
  },
  forEach: function (iterator, context) {
    this._words.forEach(iterator, context);
  },
  every: function (iterator, context) {
    return this._words.every(iterator, context);
  },
  some: function (iterator, context) {
    return this._words.some(iterator, context);
  },
  startsWith: function (phrase) {
    var phraseList = phrase instanceof WordList ? phrase : new WordList(phrase);
    var found = phraseList.every(function (phraseWord, index) {
      return phraseWord === this.words()[index];
    }, this);
    //console.log(this._words.join(' '), phrase, found)
    return found;
  }
});

exports.WordList = WordList;

function VerbPhrase(words) {
  if (_.isString(words)) {
	  words = words.split(' ');
  }

  if (Array.isArray(words)) {
	this.verb = words[0];
	this.words = words.splice(0, 1);
  }
}

function chopMessage() { }

function Parser(definition) {
  this._definition = definition || {};
  this._definition.ignored = this._definition.ignored || [];
}

_.extend(Parser.prototype, {
  parse: function parse(req, res) {
    req.message = req.message || '';
    req.words = req.words || new WordList(req.message);
    var dsl = this.for(req.words);
    var activate = this.activatesOn();
    if (activate && activate === dsl.first()) {
      dsl.take();
    } else if (activate && activate !== dsl.first()) {
      return;
    }
    while (dsl.word()) {
      if (!dsl.isIgnored() && dsl.containsWord()) {
        dsl.handle(req, res);
      }
      dsl.take();
    }
  },
  activatesOn: function () {
    return this._definition.activates;
  },
  for: function (words) {
    var word = words.first();
    var selfie = this;
    var dsl = {
      isIgnored: function () {
        return selfie._definition.ignored.indexOf(word) !== -1;
      },
      handle: function (req, res) {
        dsl.delegate(function (numberOfWords) {
          for (var i = 0; i < numberOfWords; i++) {
            words.pullFirst();
          }
        }).handler(req, res);
        return dsl;
      },
      delegate: function (callback) {
        return _.find(selfie._definition.verbs, function (verb) {
          var found = false;
          for (var length = verb.words.length, i = 0; i < length; i++) {
            var verbWord = verb.words[i];
            found = words.startsWith(verbWord);
            if (found) {
              callback && callback(i + 1);
              break;
            }
          }
          return found;
        });
      },
      containsWord: function () {
        return !!this.delegate();
      },
      word: function () {
        return word;
      },
      take: function () {
        word = words.pullFirst();
        return dsl;
      },
      first: function () {
        return words.first();
      }
    };
    return dsl;
  }
});

function ParserBuilder() {
  this._handlers = [];
}

_.extend(ParserBuilder.prototype, {
  installHandler: function installHandler(handler) {
	this._handlers.push(handler);
  },
  createParser: function createParser() {
	var parser = new Parser({
		handlers: this._handlers
	});

	return parser;
  }
});

exports.Parser = Parser;