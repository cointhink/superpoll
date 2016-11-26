'use strict'
var pgp = require('pg-promise')()
var http = require('request-promise')

module.exports = new (function(){
  let that = this
  let db

  this.setup = function(config) {
    db = pgp(config.cockroach)
    return ensureDb('cointhink')
      .then(ensureTables)

  }

  function ensureDb(name) {
    return db.query('SHOW DATABASES')
    .then(dbs => {
      let names = dbs.map(db=>db.Database)
      if (names.indexOf(name) == -1) {
        console.log('warning: creating database', name)
        return db.query('CREATE DATABASE '+name)
      }
    })
  }

  function ensureTables() {
    return tableTest('exchanges', `
        (
         id varchar(128) PRIMARY KEY,
         name varchar(128),
         marketsUrl text,
         marketsJs text,
         orderbookJs text,
         offerJs text
        )
      `)
      .then(() => tableTest('orderbooks', `
        (
         id varchar(128) PRIMARY KEY,
         date date,
         exchangeId varchar(128),
         base varchar(128),
         quote varchar(128)
        )
      `))
      .then(() => tableTest('offers', `
        (
         id varchar(128) PRIMARY KEY,
         orderbookId varchar(128),
         bidAsk varchar(128),
         price decimal(10,4),
         quantity decimal(10,4)
        )
      `))
  }

  function tableTest(name, schema) {
    return db.query('SHOW TABLES')
    .then(tables => {
      let names = tables.map(t=>t.Table)
      if(names.indexOf(name) == -1) {
        console.log('warning: table', name, 'does not exist')
        return db.query('CREATE TABLE '+name+' '+schema)
      }})
  }

  this.exchanges = function() {
    return db.query('SELECT * FROM exchanges')
  }

  this.marketlist = function(exchange) {
    let markets_format = jseval(exchange.marketsJs)
    var req = {method: 'get', url: exchange.marketsUrl, json: true}
    console.log(exchange.name, 'marketlist', req.url)
    return http(req)
      .then(function(body) {
        exchange.orderbooks = markets_format(body)
        exchange.orderbooks.forEach(function(ob){ob.exchange = exchange.id})
        return exchange
      }, err => console.log('marketlist err', req, err.message))
  }

  this.jsput = function(exchange_name, part, js) {
    let insert = "INSERT into exchanges values ($1, $2)"
    return db.query(insert, [exchange_name, exchange_name])
      .then(() => console.log('warning exchange', exchange_name, 'created'),
            () => console.log('updating', exchange_name, part))
      .then(() => {
        let sql = "UPDATE exchanges set $1~=$2 where name=$3"
        let params = [part, js, exchange_name]
        return db.query(sql, params)
      })
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

    let orderbook_format = jseval(exchange.orderbookJs)
    let offer_format = jseval(exchange.offerJs)
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
    console.log('insert', orderbook)
    let sql = "INSERT INTO orderbooks () vaules ()"
    let params = {}
    return db.query(sql, params)
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

  this.stop = function() {
    return pgp.end()
  }

  function jseval(jsfunc) {
    let js = '('+jsfunc+')'
    return eval(js)
  }

})()
