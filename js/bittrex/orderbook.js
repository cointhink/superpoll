function(response){
  var result = response.result
  return {bids: result.buy, asks: result.sell}
}
