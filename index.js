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

poll
  .setup(config)
  .then(function(){
    gopoll()
    setInterval(gopoll, config.system.poll_seconds * 1000)
  })

function gopoll(){
  poll
    .exchanges()
    .then(function(cursor){
      return cursor
             .toArray()
             .then(function(array){
               console.log('** Marketlist queries')
               return array
                      .map(function(exchange){
                         return poll.marketlist(exchange)
                       })
             })
    })
    .then(function(exchangeMarketInquiries){
      return Promise.all(exchangeMarketInquiries)
    })
    .then(function(exchanges){
      console.log('** Orderbook queries')
      return Promise.all(exchanges.filter(x => x)
             .map(function(exchange){
               let obpeek = exchange
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
              console.log(orderbook.exchange,
                          orderbook.market,
                          'orderbook head',
                          orderbook.asks[0],
                          orderbook.bids[0])
              poll.insert(orderbook)
            })
      })
    }, err => console.log('Orderbook phase err', err.message))
}
