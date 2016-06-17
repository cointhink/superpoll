var rethink = require('rethinkdb')

module.exports = new (function(){
  var that = this

  this.setup = function(config) {
    return rethink.connect(config.rethinkdb)
  }

  this.exchanges = function() {
    return rethink.table('exchanges').run(that.conn)
  }

  this.loop = function(exchanges) {
    exchanges.toArray(function(err, arr){ console.log(arr) })
  }
})()
