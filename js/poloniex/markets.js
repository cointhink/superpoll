function(body) {
    return Object.keys(body).map(function(name) {
        var market = body[name]
        var pair = name.split('_')
        return {
            market: {
                base: pair[0].toLowerCase(),
                quote: pair[1].toLowerCase()
            },
            asks: market.asks,
            bids: market.bids
        }
    })
}
