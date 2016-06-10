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
      tables = db.table_list.run(@conn)
      puts tables
    end

    def exchanges
      # Exchange.from_json(json)
      [] of Exchange
    end
  end
end
