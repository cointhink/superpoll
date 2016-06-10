module Superpoll
  module Exchanges
    class Poloniex < Exchange
      def poll(base : String, quote : String)

        pair = "#{base.upcase}_#{quote.upcase}"
        url = "https://poloniex.com/public?command=returnOrderBook&currencyPair=#{pair}"
        response = HTTP::Client.get url
        data = JSON.parse(response.body)
        #puts data.inspect
        asks = data["asks"].to_a.map{|a| Offer.new(BigFloat.new(a[0].as_s),
                                            BigFloat.new(a[1].to_s) ) }

        ob = Orderbook.new(exchange: "poloniex",
                           currencies: {"base": "btc", "quote": "eth"},
                           asks: asks)

        puts ob.to_json
      end
    end
  end
end
