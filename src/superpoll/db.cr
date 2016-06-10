require "rethinkdb-crystal"

module Superpoll

  class Db
    include RethinkDB::Shortcuts
    @conn : RethinkDB::Connection

    def initialize
      puts Config.config

      @conn = r.connect(host: "localhost")
    end
  end
end
