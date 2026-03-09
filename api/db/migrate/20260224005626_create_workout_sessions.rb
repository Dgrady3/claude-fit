class CreateWorkoutSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :workout_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :workout_program, foreign_key: true
      t.datetime :started_at
      t.datetime :completed_at
      t.text :notes

      t.timestamps
    end
  end
end
