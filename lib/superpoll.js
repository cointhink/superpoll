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
            let tableFutures = []
            if(tables.indexOf('orderbooks') == -1) {
              console.log('creating table orderbooks')
              tableFutures.push(rethink.tableCreate('orderbooks').run(that.conn))
            }
            if(tables.indexOf('exchanges') == -1) {
              console.log('creating table exchanges')
              tableFutures.push(rethink.tableCreate('exchanges').run(that.conn))
            }
            return Promise.all(tableFutures)
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
                                                   rethink.branch(
                                                    rethink.row('market')('quote').eq("USDT"),
                                                    "USD",
                                                    rethink.row('market')('quote')),
                                                   rethink.row('date')])
                  .run(conn)
            }
            if(indexes.indexOf('exchange-date') == -1) {
              console.log('creating index exchange-date')
              return rethink.table('orderbooks')
                  .indexCreate('exchange-date', [rethink.row('exchange'),
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
        exchange.orderbooks.forEach(function(ob){ob.exchange = exchange.id})
        return exchange
      }, err => console.log('marketlist err', req, err.message))
  }

  this.jsput = function(exchange_name, part, js) {
    let newpart = {}
    newpart[part] = {format: js}
    return rethink
    .table('exchanges')
    .get(exchange_name)
    .update(newpart)
    .run(that.conn)
  }

  this.poll = function(exchange, market) {
    market.date = new Date()
    let orderbook
    if(market.bids) {
      orderbook = Promise.resolve({bids: market.bids, asks: market.asks})
    } else {
      let req = {method: 'get', url: market.url, json: true}
      console.log('poll', req.url)
      orderbook = http(req)
    }

    let orderbook_format = jseval(exchange.orderbook.format)
    let offer_format = jseval(exchange.offer.format)
    return orderbook.then(function(ob) {
      let obook = orderbook_format(ob)
      if(obook.bids && obook.asks) {
        market.bids = obook.bids.map(function(ofr) {return offer_format(ofr)})
        market.asks = obook.asks.map(function(ofr) {return offer_format(ofr)})
        return market
      } else {
        return null
      }
    }, function(err){ console.log('err', err) })
  }

  this.insert = function(orderbook) {
    rethink
    .table('orderbooks')
    .insert(orderbook)
    .run(this.conn)
    .then(function(operation){
      //console.log(operation)
    })
  }

  function jseval(jsfunc) {
    let js = '('+jsfunc+')'
    return eval(js)
  }

})()
