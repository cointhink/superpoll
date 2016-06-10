module Superpoll
  class Orderbook

    JSON.mapping({
      exchange: String,
      date: String,
      currencies: Hash(String, String),
      asks: Array(Offer)
    })

    def initialize(@exchange, @currencies, @asks)
      @date = Time.now.to_s
    end
  end
end

