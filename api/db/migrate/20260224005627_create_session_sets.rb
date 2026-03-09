class CreateSessionSets < ActiveRecord::Migration[7.2]
  def change
    create_table :session_sets do |t|
      t.references :workout_session, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.integer :set_number, null: false
      t.decimal :weight_lbs, precision: 6, scale: 1
      t.integer :reps
      t.decimal :rpe, precision: 3, scale: 1
      t.boolean :warmup, default: false

      t.timestamps
    end
  end
end
