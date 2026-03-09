class CreateOuraSleepData < ActiveRecord::Migration[7.2]
  def change
    create_table :oura_sleep_data do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :sleep_score
      t.integer :deep_sleep_minutes
      t.integer :rem_sleep_minutes
      t.integer :light_sleep_minutes
      t.integer :total_sleep_minutes
      t.integer :awake_minutes
      t.decimal :efficiency, precision: 5, scale: 2

      t.timestamps
    end

    add_index :oura_sleep_data, [:user_id, :date], unique: true
  end
end
