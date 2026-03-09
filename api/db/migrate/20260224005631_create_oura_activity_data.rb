class CreateOuraActivityData < ActiveRecord::Migration[7.2]
  def change
    create_table :oura_activity_data do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :activity_score
      t.integer :steps
      t.integer :active_calories
      t.integer :total_calories
      t.integer :active_minutes

      t.timestamps
    end

    add_index :oura_activity_data, [:user_id, :date], unique: true
  end
end
