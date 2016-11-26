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
  return Promise.all(['markets.url', 'markets.js', 'offer.js', 'orderbook.js'].map(
    function(section) {
      let jsName = 'js/'+dirName+'/'+section
      let dotPos = section.indexOf('.')
      let extLetter = section.substr(dotPos+1,1)
      let column = section.substr(0, dotPos) + extLetter.toUpperCase() + section.substr(dotPos+2, section.length)
      return poll.jsput(
        dirName,
        column,
        fs.readFileSync(jsName, {encoding: 'utf8'}))
    }))
}
