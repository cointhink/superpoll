var rethink = require('rethinkdb')
var request = require('request')

module.exports = new (function(){
  var that = this

  this.setup = function(config) {
    return rethink.connect(config.rethinkdb)
  }

  this.exchanges = function() {
    return rethink.table('exchanges').run(that.conn)
  }

  this.poll = function(exchange) {
    request.get({url: exchange.market_pairs.url, json: true}, function(err, resp, body) {
      console.log(resp)
      var format = eval(exchange.market_pairs.format)
      var pairs = format(body)
      console.log(pairs)
    })
  }
})()
