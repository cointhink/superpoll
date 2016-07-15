function(body) {
    return Object.keys(body).map(function(market) {
        var pair = [body[market].substr(0, 3), body[market].substr(2, 3)];
        return {
            market: {
                base: pair[0],
                quote: pair[1]
            },
            url: 'https://api.bitfinex.com/v1/book/' + body[market] + '?limit_bids=50&limit_asks=50'
        }
    })
}
