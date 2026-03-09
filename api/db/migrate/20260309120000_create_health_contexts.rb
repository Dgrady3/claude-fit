class CreateHealthContexts < ActiveRecord::Migration[7.2]
  def change
    create_table :health_contexts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :category, null: false
      t.text :content, null: false
      t.string :source, default: "chatgpt_import"
      t.date :context_date
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :health_contexts, [:user_id, :category]
  end
end
