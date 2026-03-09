class CreateNutritionEntries < ActiveRecord::Migration[7.2]
  def change
    create_table :nutrition_entries do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.string :meal_name
      t.string :food_name, null: false
      t.decimal :calories, precision: 7, scale: 1
      t.decimal :protein_g, precision: 6, scale: 1
      t.decimal :carbs_g, precision: 6, scale: 1
      t.decimal :fat_g, precision: 6, scale: 1
      t.decimal :fiber_g, precision: 6, scale: 1
      t.decimal :sugar_g, precision: 6, scale: 1
      t.decimal :sodium_mg, precision: 7, scale: 1
      t.string :source, default: "manual"

      t.timestamps
    end

    add_index :nutrition_entries, [:user_id, :date]
  end
end
