'use strict'

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
      return cursor
             .toArray()
             .then(function(array){
               return array
                      .map(function(exchange){
                         console.log('* Start', exchange.id)
                         return poll.marketlist(exchange)
                       })
             })
    })
    .then(function(marketInquiries){
      return Promise.all(marketInquiries)
    })
    .then(function(markets){
      console.log(markets)
      return markets
             .map(function(exchange){
               return exchange
               .map(function(market){
                 console.log('poll', market.exchange, market.market)
                 //return poll.poll(market)
               })
             })
    })
    .then(function(orderbooks){
      console.log('orderbooks', orderbooks)
      // orderbooks.forEach(
      //   function(orderbook){
      //     console.log(orderbook.market)
      //     poll.insert(orderbook)
      //   })
      console.log('* Finished')
      })
}
