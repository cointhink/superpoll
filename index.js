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
      return Promise.all(exchanges
             .map(function(exchange){
               //console.log(JSON.stringify(exchange, 2))
               let obpeek= exchange
                      .orderbooks
                      .map(function(orderbook){
                        console.log('poll', orderbook.exchange, orderbook.market)
                        return poll.poll(exchange, orderbook)
                      })
               return Promise.all(obpeek)
             }))
    })
    .then(function(exchanges){
      return exchanges.map(
        function(orderbooks){
          return orderbooks.map(
            function(orderbook){
              console.log('orderbook resolve', orderbook.exchange,
                                               orderbook.market,
                                               orderbook.asks[0],
                                               orderbook.bids[0])
              poll.insert(orderbook)
            })
      })
    })
}
