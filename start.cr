# local
require "./src/superpoll"

puts "Starting superpoll #{Superpoll::VERSION}"

basedir = File.dirname(__FILE__)
Superpoll::Config.load(basedir)
db = Superpoll::Db.new

poll = Superpoll::Poll.new(db)
poll.go
