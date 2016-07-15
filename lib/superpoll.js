'use strict'
var rethink = require('rethinkdb')
var http = require('request-promise')

module.exports = new (function(){
  var that = this

  this.setup = function(config) {
    return rethink.connect(config.rethinkdb)
      .then(function(conn){
        that.conn = conn
        return rethink.tableList().run(conn)
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
        let markets_format = jseval(exchange.markets.format)
        exchange.orderbooks = markets_format(body)
        exchange.orderbooks = [ exchange.orderbooks[0] ]
        exchange.orderbooks.forEach(function(ob){ob.exchange = exchange.id})
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
    console.log('where da market', Object.keys(market))
    market.date = new Date()
    let orderbook
    if(market.bids) {
      orderbook = Promise.resolve({bids: market.bids, asks: market.asks})
    } else {
      let req = {method: 'get', url: market.url, json: true}
      console.log('poll http', req)
      orderbook = http(req)
    }

    let orderbook_format = jseval(exchange.orderbook.format)
    let offer_format = jseval(exchange.offer.format)
    return orderbook.then(function(ob) {
      console.log('*- resolved orderbook', exchange.id, Object.keys(ob))
      let obook = orderbook_format(ob)
      market.bids = obook.bids.map(function(ofr) {return offer_format(ofr)})
      market.asks = obook.asks.map(function(ofr) {return offer_format(ofr)})
      return market
    }, function(err){ console.log('err', err) })
  }

  this.insert = function(orderbook) {
    //console.log(orderbook.exchange, orderbook.market,
    //            orderbook.bids.length, orderbook.asks.length)
    rethink.table('orderbooks').insert(orderbook).run(this.conn)
  }

  function jseval(jsfunc) {
    let js = '('+jsfunc+')'
    return eval(js)
  }

})()
