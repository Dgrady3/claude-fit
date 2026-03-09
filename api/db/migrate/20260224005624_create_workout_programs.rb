class CreateWorkoutPrograms < ActiveRecord::Migration[7.2]
  def change
    create_table :workout_programs do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.boolean :active, default: false

      t.timestamps
    end
  end
end
