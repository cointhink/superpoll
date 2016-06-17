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
                      rethink.tableCreate('orderbooks').run(this.conn)
                    }
                  })
              })
  }

  this.exchanges = function() {
    return rethink.table('exchanges').run(that.conn)
  }

  this.poll = function(exchange) {
    var req = {method: 'get', url: exchange.market_pairs.url, json: true}
    return http(req).
      then(function(body) {
        var format = eval(exchange.market_pairs.format)
        var pairs = format(body)

        return Object.keys(pairs).map(function(ob) {
          var market = pairs[ob]
          var offers
          if(market.bids) {
            offers = Promise.resolve({bids: market.bids, asks: market.asks})
          } else {
            var oreq = {method: 'get', url: exchange.orderbook.url, json: true}
            offers = http(oreq)
          }

          var oformat = eval(exchange.orderbook.format)
          offers.then(function(ofrs){
            market.bids = ofrs.bids.map(function(ofr){return oformat(ofr)})
            market.asks = ofrs.asks.map(function(ofr){return oformat(ofr)})
          })
          return Promise.resolve(market)
        })
      })
  }

  this.insert = function(orderbook) {
    console.log('inserting', orderbook.exchange, orderbook.market,
                             orderbook.bids.length, orderbook.asks.length)
    rethink.table('orderbooks').insert(orderbook).run(this.conn)
  }
})()
