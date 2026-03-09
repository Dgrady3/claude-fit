class NutritionEntrySerializer
  include JSONAPI::Serializer

  attributes :id, :date, :meal_name, :food_name, :calories, :protein_g,
             :carbs_g, :fat_g, :fiber_g, :sugar_g, :sodium_mg, :source
end
