var rethink = require('rethinkdb')
var http = require('request-promise')

module.exports = new (function(){
  var that = this

  this.setup = function(config) {
    return rethink.connect(config.rethinkdb)
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

        var native_orderbooks = Object.keys(pairs).map(function(ob) {
          var optional_book = pairs[ob]
          if(optional_book) {
            return Promise.resolve(optional_book)
          } else {
            var oreq = {method: 'get', url: exchange.orderbook.url, json: true}
            return http(oreq)
          }
        })

        return native_orderbooks.map(function(nob){
          return nob.then(function(ob){
            var oformat = eval(exchange.orderbook.format)
            var v = oformat(ob)
            return v
          })
        })
      })
  }

  this.insert = function(orderbook) {
    console.log('inserting', orderbook)
  }
})()
