
var Q = require('q');
var Options = require('./options');
var ES5Class = require('es5class');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var sprintf = require('sprintf').sprintf;
var apiResponse = require('express-api-response');

var WithSearchFields = ES5Class.$define('WithSearchField', {
  withSearchString: function (field, term) {
    if (!term) {
      term = field;
    }
    this.on('req', function (req, query) {
      query[term] = req.params[field];
    });
    this._route += sprintf("/:%s", field);
    return this;
  },
  withSearchNumber: function (field) {
    this.on('req', function (req, query) {
      query[field] = parseInt(req.params[field], 10);
    });
    this._route += sprintf("/:%s", field);
    return this;
  }
});

var ServiceDsl = ES5Class.$define('ServiceDsl', {
  construct: function (options) {
    options = Options.for(options);
    this._provider = options.expect('provider')
    this._route = options.expect('route');
    this._name = options.expect('name');
    this._find = options.default('find', 'find');
  },
  model: function () {
    return this._provider(this._name);
  },
  route: function () {
    return this._route;
  },
  justOne: function () {
    this._find = 'findOne';
    return this;
  },
  middleware: function () {
    var middleware = {
      find: function(req, res) {
        var query = {};
        this.emit('req', req, query);
        var model = this.model();
        return Q(model[this._find].call(model, query).exec())
          .then(function (all) {
            res.json(all);
          })
          .fail(function (err) {
            res.send(err);
          })
          .finally(function () {
          });
      }.bind(this),
      create: function (req, res) {
        var data = req.body;
        var model = this.model();
        return Q(this.model().create([data]).exec())
          .then(function (all) {
            res.json(all);
          })
          .fail(function (err) {
            res.send(err);
          })
          .finally(function () {
          });
      }.bind(this),
      update: function (req, res) {
        middleware.find(req, res)
          .then(function () {
            _(this.model()).extend(req.body);
            Q(this.model().save().exec())
              .fail(function (err) {
                res.send(err);
              })
              .finally(function () {
              });
          }.bind(this));
      }.bind(this)
    };
    var route = function (method, endpoint) {
      return function (router) {
        router.route(this.route())[method](endpoint);
      }.bind(this);
    }.bind(this);
    
    return {
      GET: route('get', middleware.find),
      POST: route('post', middleware.create),
      PUT: route('put', middleware.update)
    }
  }
})
  .$implement(EventEmitter)
  .$implement(WithSearchFields);

exports.service = function (options) {
  var dsl = ServiceDsl.$create(options);
  return dsl;
}
