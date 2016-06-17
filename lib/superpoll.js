var rethink = require('rethinkdb')

module.exports = new (function(){
  this.setup = function(config) {
    return rethink.connect(config.rethinkdb)
  }

  this.loop = function(conn) {
    console.log('looping', conn)
  }
})()
