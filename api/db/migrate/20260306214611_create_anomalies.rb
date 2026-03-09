class CreateAnomalies < ActiveRecord::Migration[7.2]
  def change
    create_table :anomalies do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.string :metric, null: false
      t.decimal :value, precision: 8, scale: 2
      t.decimal :baseline_mean, precision: 8, scale: 2
      t.decimal :z_score, precision: 4, scale: 2
      t.string :severity
      t.string :message
      t.string :correlated_metric
      t.datetime :dismissed_at
      t.timestamps
    end
    add_index :anomalies, [:user_id, :date, :metric], unique: true
  end
end
