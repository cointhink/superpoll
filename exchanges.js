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

poll.setup(config)
  .then(() => {
    if (process.argv.length == 2) {
      return poll.exchanges()
        .then(function(exchanges){
          console.log('Exchange list')
          exchanges.forEach(function(exchange){
            console.log(JSON.stringify(exchange, null ,2))
          })
        })
    } else {
      let updates = fs.readdirSync('js').map(marketPush)
      return Promise.all(updates)
    }
  })
  .then(poll.stop)
  .catch(e => console.log('err', e.stack))

function marketPush(dirName) {
  return Promise.all(['markets', 'offer', 'orderbook'].map(
    function(section) {
      let jsName = 'js/'+dirName+'/'+section+'.js'
      console.log('loading', jsName)
      return poll.jsput(
        dirName,
        section,
        fs.readFileSync(jsName, {encoding: 'utf8'}))
    }))
}
