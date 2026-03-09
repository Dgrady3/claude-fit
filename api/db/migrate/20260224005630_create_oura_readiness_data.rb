class CreateOuraReadinessData < ActiveRecord::Migration[7.2]
  def change
    create_table :oura_readiness_data do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :readiness_score
      t.decimal :hrv_average, precision: 6, scale: 2
      t.integer :resting_heart_rate
      t.decimal :body_temperature_delta, precision: 4, scale: 2

      t.timestamps
    end

    add_index :oura_readiness_data, [:user_id, :date], unique: true
  end
end
