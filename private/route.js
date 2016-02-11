


module.exports = function (app) {
  var express = require('express');
  var web = require('./service');
  var model = require('./model');
  
  var router = express.Router();

  var playerService = web.service({
    provider: model.get,
    name: 'Player',
    route: '/player'
  })
    .withSearchNumber('id')
    .justOne();
    
  playerService.middleware().GET(router);
  
  web.service({
    provider: model.get,
    name: 'Player',
    route: '/players'
  }).middleware().GET(router);
  
  web.service({
    provider: model.get,
    name: 'Player',
    route: '/players'
  }).middleware().POST(router);
  
  return router;
  // 
  // app.get.apply(
  //   app, web.service({
  //     provider: morpheus.get,
  //     name: 'Scene',
  //     route: '/scenes'
  //   })
  //     .middleware()
  // );
  // 
  // app.get.apply(
  //   app, web.service({
  //     provider: morpheus.get,
  //     name: 'Cast',
  //     route: '/cast'
  //   })
  //     .withSearchString('type', '__t')
  //     .withSearchNumber('castId')
  //     .justOne()
  //     .middleware()
  // );
  // 
  // app.get.apply(
  //   app, web.service({
  //     provider: morpheus.get,
  //     name: 'Cast',
  //     route: '/cast'
  //   })
  //     .withSearchString('type', '__t')
  //     .middleware()
  // );
  // 
  // app.get.apply(
  //   app, web.service({
  //     provider: morpheus.get,
  //     name: 'Cast',
  //     route: '/casts'
  //   })
  //     .middleware()
  // );
  // 
  // app.get.apply(
  //   app, web.service({
  //     provider: morpheus.get,
  //     name: 'MovieSpecialCast',
  //     route: '/movie'
  //   })
  //     .withSearchNumber('castId')
  //     .justOne()
  //     .middleware()
  // );
  // 
  // app.get.apply(
  //   app, web.service({
  //     provider: morpheus.get,
  //     name: 'MovieSpecialCast',
  //     route: '/movies'
  //   })
  //     .middleware()
  // );
  
};
