class CreateExerciseInsights < ActiveRecord::Migration[7.2]
  def change
    create_table :exercise_insights do |t|
      t.references :video_knowledge, null: false, foreign_key: true
      t.string :exercise_name, null: false
      t.string :muscle_group
      t.string :recommended_sets
      t.string :recommended_reps
      t.string :recommended_rest_seconds
      t.string :recommended_rpe
      t.text :key_insight
      t.decimal :confidence, precision: 3, scale: 2

      t.timestamps
    end

    add_index :exercise_insights, :muscle_group
    add_index :exercise_insights, :exercise_name
  end
end
