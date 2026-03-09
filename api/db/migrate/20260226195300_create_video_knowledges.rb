class CreateVideoKnowledges < ActiveRecord::Migration[7.2]
  def change
    create_table :video_knowledges do |t|
      t.string :youtube_video_id, null: false
      t.string :title
      t.string :channel
      t.string :url
      t.integer :duration_seconds
      t.text :topic_summary
      t.jsonb :key_takeaways, default: []
      t.text :transcript
      t.string :model_used
      t.integer :prompt_tokens
      t.integer :completion_tokens
      t.datetime :processed_at

      t.timestamps
    end

    add_index :video_knowledges, :youtube_video_id, unique: true
    add_index :video_knowledges, :channel
  end
end
