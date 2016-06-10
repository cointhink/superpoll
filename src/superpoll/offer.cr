require "big_float"

module Superpoll
  class Offer

    JSON.mapping({
      quantity: BigFloat,
      price: BigFloat,
    })

    def initialize(@quantity, @price)
    end

  end
end

