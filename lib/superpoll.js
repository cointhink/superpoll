var rethink = require('rethinkdb')
var require = require('request')

module.exports = new (function(){
  var that = this

  this.setup = function(config) {
    return rethink.connect(config.rethinkdb)
  }

  this.exchanges = function() {
    return rethink.table('exchanges').run(that.conn)
  }

  this.poll = function(exchange) {

  }
})()
