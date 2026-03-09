class CreateUserGoals < ActiveRecord::Migration[7.2]
  def change
    create_table :user_goals do |t|
      t.references :user, null: false, foreign_key: true
      t.string :goal_type, null: false
      t.decimal :target_value, precision: 8, scale: 2
      t.decimal :current_value, precision: 8, scale: 2
      t.date :target_date

      t.timestamps
    end

    add_index :user_goals, [:user_id, :goal_type]
  end
end
