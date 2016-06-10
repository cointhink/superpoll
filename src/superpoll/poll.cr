module Superpoll
  class Poll
    def initialize
    end

    def go
      puts "polling"
      $db.exchanges.each do |exchange|
        puts exchange
      end
    end
  end
end
