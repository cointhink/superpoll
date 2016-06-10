# local
require "./src/superpoll"

puts "Starting superpoll"

basedir = File.dirname(__FILE__)

config = Superpoll::Config.load(basedir)

poll = Superpoll::Poll.new
poll.go
