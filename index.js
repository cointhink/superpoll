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
      return exchanges
             .map(function(exchange){
               //console.log(JSON.stringify(exchange, 2))
               return exchange
                      .orderbooks
                      .map(function(market){
                        console.log('poll', exchange.id, market)
                        return poll.poll(exchange, market)
                      })
             })
    })
    .then(function(orderbooks){
      return orderbooks.forEach(
        function(orderbook){
          console.log('orderbook resolve', orderbook.length)
          return Promise.all(orderbook)
          .then(function(ob){
            console.log('alldone. top ob', JSON.stringify(orderbook[0]))
            //poll.insert(orderbook)
          }, function(err){ console.log('err', err) })
        })
      })
    .then(function(){
      console.log('* Finished')
    })
}
