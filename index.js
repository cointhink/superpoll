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
    .then(function(exchangeMarketInquiries){
      return Promise.all(exchangeMarketInquiries)
    })
    .then(function(exchanges){
      console.log(exchanges)
      return exchanges
             .map(function(exchange){
               return exchange
                      .orderbooks
                      .map(function(market){
                        console.log('poll', market.exchange, market.market)
                        return poll.poll(exchange, market)
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
