function(body) {
    return Object.keys(body).map(function(name) {
        var market = body[name]
        var pair = name.split('_')
        var base = pair[1]
        var quote = pair[0]
        return {
            market: {
                base: base,
                quote: quote
            },
            asks: market.asks,
            bids: market.bids
        }
    })
}
