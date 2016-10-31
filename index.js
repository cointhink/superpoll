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
                          'top ask',
                          orderbook.asks[0],
                          'top bid',
                          orderbook.bids[0])
              poll.insert(orderbook)
              return orderbook
            })
      })
    }, err => console.log('Orderbook phase err', err.message))
    .then( orderbooks => {
      orderbooks.forEach( exchange => {
        exchange.forEach( market => {
          console.log('** nexto', market.date, market.exchange, market.market)
          let ago = config.system.poll_seconds * 1000
          let now = new Date()
          poll
            .last(market.market.base, market.market.quote, now, ago)
            .then(function(cursor){
              cursor
              .toArray()
              .then(function(books) {
                // inefficient but...
                let partialBooks = books.filter(function(book){ return book.exchange == market.exchange })
                if(partialBooks.length >= 2) {
                  partialBooks
                    .forEach(function(book){
                      let delay = (market.date-book.date)/1000
                      console.log('fetch ', book.exchange, book.market.base, book.market.quote,
                                  delay.toFixed(2)+'s')
                    })
                  let askChg = parseFloat(partialBooks[0].asks[0][0]) -
                               parseFloat(partialBooks[1].asks[0][0])
                  let bidChg = parseFloat(partialBooks[0].bids[0][0]) -
                               parseFloat(partialBooks[1].bids[0][0])
                  console.log('diff', market.exchange, market.market.base, market.market.quote,
                              'askChg', askChg, 'bidChg', bidChg)
                } else {
                  console.log('no previous timeslot for', market.exchange, market.market.base, market.market.quote)
                }
              })
            })

        })
      })
    })
}
