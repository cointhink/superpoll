'use strict'
var rethink = require('rethinkdb')
var http = require('request-promise')

module.exports = new (function(){
  var that = this

  this.setup = function(config) {
    return rethink.connect(config.rethinkdb)
      .then(function(conn){
        that.conn = conn
        rethink.tableList().run(conn)
          .then(function(tables){
            console.log(tables)
            if(tables.indexOf('orderbooks') == -1) {
              console.log('creating table orderbooks')
              return rethink.tableCreate('orderbooks').run(that.conn)
            }
          })
          .then(function(){
            return rethink.table('orderbooks').indexList().run(that.conn)
          })
          .then(function(indexes){
            console.log(indexes)
            if(indexes.indexOf('date') == -1) {
              console.log('creating index date')
              return rethink.table('orderbooks')
                  .indexCreate('date').run(conn)
            }
            if(indexes.indexOf('base-quote-date') == -1) {
              console.log('creating index base-quote-date')
              return rethink.table('orderbooks')
                  .indexCreate('base-quote-date', [rethink.row('market')('base'),
                                                   rethink.row('market')('quote'),
                                                   rethink.row('date')])
                  .run(conn)
            }
          })
      })
  }

  this.exchanges = function() {
    return rethink.table('exchanges').run(that.conn)
  }

  this.marketlist = function(exchange) {
    var req = {method: 'get', url: exchange.markets.url, json: true}
    console.log('marketlist', req)
    return http(req)
      .then(function(body) {
        let js = '('+exchange.markets.format+')'
        console.log('js', js)
        let markets_format = eval(js)
        //console.log('body', body)
        exchange.orderbooks = markets_format(body)
        return exchange
      })
  }

  this.jsput = function(exchange_name, part, js) {
    let newpart = {}
    newpart[part] = {format: js}
    rethink
    .table('exchanges')
    .get(exchange_name)
    .update(newpart)
    .run(that.conn)
  }

  this.poll = function(exchange, market) {
    market.date = new Date()
    let offers
    if(market.bids) {
      offers = Promise.resolve({bids: market.bids, asks: market.asks})
    } else {
      let req = {method: 'get', url: market.url, json: true}
      console.log('poll', req)
      offers = http(req)
    }

    // let oformat = eval(exchange.orderbook.format)
    // offers.then(function(ofrs) {
    //   market.bids = ofrs.bids.map(function(ofr) {return oformat(ofr)})
    //   market.asks = ofrs.asks.map(function(ofr) {return oformat(ofr)})
    // })
    return market
  }

  this.insert = function(orderbook) {
    //console.log(orderbook.exchange, orderbook.market,
    //            orderbook.bids.length, orderbook.asks.length)
    rethink.table('orderbooks').insert(orderbook).run(this.conn)
  }
})()
