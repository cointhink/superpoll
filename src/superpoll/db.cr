require "rethinkdb-crystal"

module Superpoll
  class Db
    include RethinkDB::Shortcuts
    @conn : RethinkDB::Connection

    def initialize
      @conn = r.connect(host: $config.config["rethinkdb"]["host"].as_s)
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
      db.table("exchanges").run(@conn).to_a.map do |result|
        Exchange.new(name = result.as_h["name"].to_s)
      end
    end
  end
end
