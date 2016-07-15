function(body) {
    return Object.keys(body).map(function(name) {
        var market = body[name]
        var pair = name.split('_')
        return {
            market: {
                base: pair[0],
                quote: pair[1],
                asks: market.asks,
                bids: market.bids
            }
        }
    })
}
