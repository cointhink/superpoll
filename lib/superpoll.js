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
    console.log('marketlist url', req.url)
    return http(req)
      .then(function(body) {
        //console.log('js', exchange.markets.format)
        markets_format = eval('('+exchange.markets.format+')')
        return markets_format(body)
      })
  }

  this.poll = function(market) {
    var req = {method: 'get', url: exchange.market_pairs.url, json: true}
    console.log(req.url)
    return http(req)
      .then(function(body) {
        var format = eval(exchange.market_pairs.format)
        var pairs = format(body)
        console.log('markets', Object.keys(pairs).length)
        return Object.keys(pairs).map(function(ob) {
          var market = pairs[ob]
          market.date = new Date()
          var offers
          if(market.bids) {
            offers = Promise.resolve({bids: market.bids, asks: market.asks})
          } else {
            var oreq = {method: 'get', url: exchange.orderbook.url, json: true}
            offers = http(oreq)
          }

          var oformat = eval(exchange.orderbook.format)
          offers.then(function(ofrs) {
            market.bids = ofrs.bids.map(function(ofr) {return oformat(ofr)})
            market.asks = ofrs.asks.map(function(ofr) {return oformat(ofr)})
          })
          return market
        })
      })
  }

  this.insert = function(orderbook) {
    //console.log(orderbook.exchange, orderbook.market,
    //            orderbook.bids.length, orderbook.asks.length)
    rethink.table('orderbooks').insert(orderbook).run(this.conn)
  }
})()
