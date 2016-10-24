/**
 * Created by jdean-MBPro on 3/17/15.
 */

var express = require('express');
var app = express();
var server = require('http').Server(app);
var config = require('config');
var winston = require('winston');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

// Init bodyparser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Logging
var logger = app.logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level: config.logLevel || 'debug' })
  ]
});

// Init routes
app.use('/api', require('./private/route')(app));

// Open DB
var mongoose = require('mongoose');

app.db = mongoose.connect(config.mongodb.uri, {server:{auto_reconnect:true}});
mongoose.connection.once('open', function () {
  logger.debug('connected to db');
  // Load server models
  require('./private/model').install(app.db);
  require('./private/slack').connect(app);

  // Create a static web route to public folder
  app.use(express.static(__dirname + '/public'));

  // Start listening on port 3000
  app.listen(3003, function (err) {
     if (err) {
        throw new Error(err)
     }

     console.log('Let\'s go!');
  });

});
