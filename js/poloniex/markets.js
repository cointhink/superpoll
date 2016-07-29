function(body) {
    return Object.keys(body).map(function(name) {
        var market = body[name]
        var pair = name.split('_')
        return {
            market: {
                base: pair[1],
                quote: pair[0]
            },
            asks: market.asks,
            bids: market.bids
        }
    })
}
