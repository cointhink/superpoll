module Superpoll
  class Poll
    def initialize(db : Db)
      @db = db
    end

    def go
      puts "polling"
    end
  end
end
