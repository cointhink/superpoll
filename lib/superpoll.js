'use strict'
var arango = require('arango')
var http = require('request-promise')

module.exports = new (function(){
  var that = this
  let db

  this.setup = function(config) {
    return new Promise(function(res,rej){
      db = arango.Connection(config.arango)
      res()
    })
  }

  this.exchanges = function() {
    return rethink.table('exchanges').run(that.conn)
  }

  this.marketlist = function(exchange) {
    var req = {method: 'get', url: exchange.markets.url, json: true}
    console.log(exchange.id, 'marketlist', req.url)
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
    return rethink
      .table('orderbooks')
      .insert(orderbook)
      .run(this.conn)
      .then(function(operation){
        //console.log(operation)
      })
  }

  this.last = function(base, quote, now, duration) {
    let early = [base, quote, new Date(now-duration)]
    let late = [base, quote, now]
    return rethink
      .table('orderbooks')
      .orderBy({index: rethink.desc('base-quote-date')})
      .between(early, late)
      .run(this.conn)
  }

  function jseval(jsfunc) {
    let js = '('+jsfunc+')'
    return eval(js)
  }

})()
