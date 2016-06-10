# local
require "./src/superpoll"

basedir = File.dirname(__FILE__)
puts "Starting superpoll #{Superpoll::VERSION} in #{basedir}"
puts

$config = Superpoll::Config.new(basedir)
$db = Superpoll::Db.new

poll = Superpoll::Poll.new
poll.go
