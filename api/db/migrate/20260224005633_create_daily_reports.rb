class CreateDailyReports < ActiveRecord::Migration[7.2]
  def change
    create_table :daily_reports do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.text :analysis_text
      t.jsonb :recommendations, default: {}
      t.jsonb :scores, default: {}
      t.jsonb :raw_data_snapshot, default: {}
      t.string :model_used
      t.integer :prompt_tokens
      t.integer :completion_tokens

      t.timestamps
    end

    add_index :daily_reports, [:user_id, :date], unique: true
  end
end
