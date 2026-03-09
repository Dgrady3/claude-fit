class CreateGlucoseReadings < ActiveRecord::Migration[7.2]
  def change
    create_table :glucose_readings do |t|
      t.references :user, null: false, foreign_key: true
      t.datetime :recorded_at
      t.decimal :value_mgdl, precision: 5, scale: 1
      t.string :source
      t.string :meal_context

      t.timestamps
    end
  end
end
