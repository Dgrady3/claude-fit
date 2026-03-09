class AddReportTypeToDailyReports < ActiveRecord::Migration[7.2]
  def change
    add_column :daily_reports, :report_type, :string, default: "daily", null: false
    remove_index :daily_reports, [:user_id, :date]
    add_index :daily_reports, [:user_id, :date, :report_type], unique: true
  end
end
