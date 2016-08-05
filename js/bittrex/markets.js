function(response) {
    return response.result.map(function(market) {
        return {
            market: {
                base: market.MarketCurrency,
                quote: market.BaseCurrency
            },
            url: 'https://bittrex.com/api/v1.1/public/getorderbook?market=' + market.MarketName + '&type=both&depth=50'
        }
    })
}
