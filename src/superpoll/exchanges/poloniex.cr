module Superpoll
  module Exchanges
    class Poloniex < Exchange
      def poll(base : String, quote : String)
        ob = Orderbook.new
        pair = "#{base.upcase}_#{quote.upcase}"
        url = "https://poloniex.com/public?command=returnOrderBook&currencyPair=#{pair}"
        response = HTTP::Client.get url
        data = JSON.parse(response.body)
        puts data.inspect
      end
    end
  end
end
