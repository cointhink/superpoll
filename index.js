// node
var fs = require('fs')

// npm
var Hjson = require('hjson');

// local
var poll = require('./lib/superpoll.js')

// config
var hjson = fs.readFileSync('./config.hjson', {encoding: 'utf8'})
var config = Hjson.parse(hjson)

poll
  .setup(config)
  .then(poll.exchanges)
  .then(function(cursor){
    cursor.each(function(err, exchange){
      console.log('* Start', exchange.id)
      poll.poll(exchange)
      .then(function(orderbooks){
        orderbooks.forEach(function(orderbook){
          poll.insert(orderbook)
        })
      })
      .then(function(){
        console.log('* Finished', exchange.id)
      })
    })
  })
