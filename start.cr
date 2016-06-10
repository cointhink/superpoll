# local
require "./src/superpoll"

puts "Starting superpoll #{Superpoll::VERSION}"

basedir = File.dirname(__FILE__)
Superpoll::Config.load(basedir)

poll = Superpoll::Poll.new
poll.go
