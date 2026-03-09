class CreateProgramExercises < ActiveRecord::Migration[7.2]
  def change
    create_table :program_exercises do |t|
      t.references :workout_program, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.integer :position
      t.integer :rest_seconds, default: 90
      t.integer :target_sets, default: 3
      t.integer :target_reps, default: 10

      t.timestamps
    end
  end
end
