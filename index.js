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
      console.log('Marketlist phase')
      return Promise.all(exchangeMarketInquiries)
    })
    .then(function(exchanges){
      console.log('Orderbook phase')
      return Promise.all(exchanges.filter(x=>x)
             .map(function(exchange){
               let obpeek= exchange
                      .orderbooks
                      .map(function(orderbook){
                        console.log('poll', orderbook.exchange, orderbook.market)
                        return poll.poll(exchange, orderbook)
                      })
               return Promise.all(obpeek)
             }))
    }, err => console.log('Marketlist phase err', err.message))
    .then(function(exchanges){
      console.log('Final phase')
      return exchanges.map(
        function(orderbooks){
          return orderbooks.filter(x=>x).map(
            function(orderbook){
              console.log(
                          orderbook.exchange,
                          orderbook.market,
                          'orderbook head',
                          orderbook.asks[0],
                          orderbook.bids[0])
              poll.insert(orderbook)
            })
      })
    }, err => console.log('Orderbook phase err', err.message))
}
