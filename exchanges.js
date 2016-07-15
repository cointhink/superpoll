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

var delay = 60 // seconds between poll

let db = poll.setup(config)

if (process.argv.length == 2) {
  db
  .then(poll.exchanges)
  .then(function(cursor){
    cursor.each(function(err, exchange){
      console.log(JSON.stringify(exchange))
    })
  })
} else {
  console.log('loading', process.argv)
  db
  .then(function(conn){
    poll.jsput(
      process.argv[2],
      process.argv[3],
      fs.readFileSync(process.argv[4], {encoding: 'utf8'})
    )
  })
}