'use strict'

// node
var fs = require('fs')

// npm
var Hjson = require('hjson');

// local
var poll = require('./lib/superpoll.js')

// config
var hjson = fs.readFileSync('./config.hjson', {encoding: 'utf8'})
var config = Hjson.parse(hjson)

let db = poll.setup(config)

if (process.argv.length == 2) {
  db
  .then(poll.exchanges)
  .then(function(cursor){
    cursor.each(function(err, exchange){
      console.log(JSON.stringify(exchange, null ,2))
    })
  })
} else {
  fs.readdirSync('js').forEach(
    function(dirName) {
      ['markets', 'offer', 'orderbook'].forEach(
        function(section) {
          let jsName = 'js/'+dirName+'/'+section+'.js'
          console.log('loading', jsName)
          db
          .then(function(conn){
            return poll.jsput(
              dirName,
              section,
              fs.readFileSync(jsName, {encoding: 'utf8'})
            )
          }, x => console.log(x))
        })
    })
}