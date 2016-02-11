var Parser = require('../../private/parser').Parser;
var WordList = require('../../private/parser').WordList;
var sinon = require('sinon');
var expect = require('chai').expect;

describe('parser suite', function () {

  it('sanity', function () {
    expect(new Parser).to.be.ok;
  });

  describe('WordList', function () {

    it('sanity', function () {
      expect(new WordList).to.be.ok;
    });

    it('#words', function () {
      var words = "the quick brown fox";
      var list = new WordList(words);
      expect(list.words()).contains('the', 'quick', 'brown', 'fox');
    });

    it('#first', function () {
      var words = "the quick brown fox";
      var list = new WordList(words);
      expect(list.first()).equals('the');
    });

    it('#last', function () {
      var words = "the quick brown fox";
      var list = new WordList(words);
      expect(list.last()).equals('fox');
    });

    it('#pullFirst', function () {
      var words = "the quick brown fox";
      var list = new WordList(words);
      expect(list.pullFirst()).equals('the');
      expect(list.words()).contains('quick', 'brown', 'fox');
    });
  });

  describe('#Parser', function () {

    describe('usage', function () {
      var parser, responseStub;

      beforeEach(function () {
        parser = new Parser({
          activator: 'clashbot',
          verbs: [
            {
              words: ['get', 'git', 'what is the'],
              handler: function (req, res) {
                if (req.words.contains('info')) {
                  res.send('got info');
                }
              }
            }
          ]
        });
        responseStub = {
          send: sinon.stub()
        };
      });

      it('simple', function () {

        parser.parse({
          message: 'clashbot get info'
        }, responseStub);
        expect(responseStub.send.calledOnce).to.be.ok;

        responseStub.send.reset();
      });

      it('multi word', function () {
        parser.parse({
          message: 'clashbot what is the info'
        }, responseStub);
        expect(responseStub.send.calledOnce).to.be.ok;
      });

      it('ignores words', function () {
        parser.parse({
          message: 'clashbot banana get info'
        }, responseStub);
        expect(responseStub.send.calledOnce).to.be.ok;
      });

      it('ignores when not addressed', function () {
        parser.parse({
          message: 'get info'
        }, responseStub);
        expect(responseStub.send.calledOnce).to.be.notOk;
      });

    });
  });
});