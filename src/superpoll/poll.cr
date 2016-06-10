module Superpoll
  class Poll
    def initialize
    end

    def go
      puts "polling"
      $db.exchanges.each do |exchange|
        orderbook = exchange.poll("BTC", "ETH")
      end
    end
  end
end
