class CreateExercises < ActiveRecord::Migration[7.2]
  def change
    create_table :exercises do |t|
      t.string :name, null: false
      t.string :muscle_group
      t.string :equipment
      t.references :user, foreign_key: true

      t.timestamps
    end

    add_index :exercises, :muscle_group
    add_index :exercises, [:name, :user_id], unique: true
  end
end
