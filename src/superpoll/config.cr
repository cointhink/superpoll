module Superpoll
  module Config
    @@config_filename = "config.json"

    def self.load(dir : String)
      config_file = File.join(dir, @@config_filename)

      if !File.exists?(config_file)
        json = File.read(config_file+".sample")
        File.write(config_file, json)
      end

      JSON.parse(File.read(config_file))
    end
  end
end
