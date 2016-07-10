// node
var fs = require('fs')

// npm
var Hjson = require('hjson');

// local
var poll = require('./lib/superpoll.js')

// config
var hjson = fs.readFileSync('./config.hjson', {encoding: 'utf8'})
var config = Hjson.parse(hjson)

var delay = 60 // seconds between poll

poll
  .setup(config)
  .then(function(){
    gopoll()
    setInterval(gopoll, delay * 1000)
  })

function gopoll(){
  poll
    .exchanges()
    .then(function(cursor){
      cursor.each(function(err, exchange){
        console.log('* Start', exchange.id)
        poll.poll(exchange)
        .then(function(orderbooks){
          orderbooks.forEach(function(orderbook){
            console.log(orderbook.market)
            poll.insert(orderbook)
          })
        })
        .then(function(){
          console.log('* Finished', exchange.id)
        })
      })
    })
}
