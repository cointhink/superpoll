require "rethinkdb-crystal"

module Superpoll
  class Db
    include RethinkDB::Shortcuts
    @conn : RethinkDB::Connection

    def initialize
      @conn = r.connect(host: $config["rethinkdb"]["host"].as_s)
      table_ensure("exchanges")
    end

    def db
      r.db("cointhink")
    end

    def table_ensure(table_name : String)
      unless db.table_list.run(@conn).includes?(table_name)
        puts "Warning: Creating #{table_name}"
        db.table_create(table_name).run(@conn)
      end
    end

    def exchanges
      db.table("exchanges").run(@conn).to_a.compact_map do |result|
        exchange_name = result.as_h["name"].to_s
        case exchange_name
        when "poloniex"
          Exchanges::Poloniex.new
        else
          puts "unknown exchange: #{exchange_name}"
        end
      end
    end
  end
end
