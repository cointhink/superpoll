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
  .then(poll.stop)
  .catch(e => console.log('err',e))

function gopoll(){
  poll
    .exchanges()
    .then(function(exchanges){
       console.log('** Marketlist queries')
       return exchanges.map(poll.marketlist)
    })
    .then(function(exchangeMarketInquiries){
      return Promise.all(exchangeMarketInquiries)
    })
    .then(function(exchanges){
      console.log('** Orderbook queries')
      return Promise.all(exchanges.filter(x => x)
             .map(function(exchange){
               let obpeek = exchange
                              .orderbooks //.slice(0,2)
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

              return poll.insert(orderbook)
                .then(orderbook => orderbook, e => console.log('insert err',e))
            })
      })
    }, err => console.log('Orderbook phase err', err.message))
    .then( orderbooks => {
      console.log('step3')
      orderbooks.forEach( exchange => {
        exchange.forEach( market => {
          console.log('** nexto', market.date, market.exchange, market.market)
          let slotLength = config.system.poll_seconds * 1000
          let slots = 2
          let now = new Date()
          poll
            .last(market.market.base, market.market.quote, now, slotLength * slots)
            .then(function(cursor){
              cursor
              .toArray()
              .then(function(books) {
                // books contains all exchanges, too much info.
                let partialBooks = books.filter(book => book.exchange == market.exchange)
                if(partialBooks.length >= slots) {
                  // todo: compute summary chg for whole array
                  if(partialBooks[0].asks.length > 0 &&
                     partialBooks[0].bids.length > 0 &&
                     partialBooks[1].asks.length > 0 &&
                     partialBooks[1].bids.length > 0) {
                    let askChg = parseFloat(partialBooks[0].asks[0][0]) -
                                 parseFloat(partialBooks[1].asks[0][0])
                    let bidChg = parseFloat(partialBooks[0].bids[0][0]) -
                                 parseFloat(partialBooks[1].bids[0][0])
                    let delay = (partialBooks[0].date - partialBooks[1].date)/1000
                    console.log('diff', market.exchange, market.market.base, market.market.quote,
                                'delay', delay+'s', 'askChg', askChg.toFixed(4), 'bidChg', bidChg.toFixed(4))
                  } else {
                    console.log('missing book data in', market.exchange, market.market.base, market.market.quote)
                  }
                } else {
                  console.log('no previous timeslot for', market.exchange, market.market.base, market.market.quote)
                }
              })
            })

        })
      })
    })
}
