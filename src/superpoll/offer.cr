require "big_float"

module Superpoll
  class Offer

    JSON.mapping({
      quantity: BigFloat,
      price: {type: BigFloat, converter: FloatString},
    })

    def initialize(@quantity, @price)
    end

  end

  class FloatString
    def self.to_json(value, io)
      value.to_s
    end
  end

end

