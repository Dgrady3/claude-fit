namespace :youtube do
  desc "Process a YouTube video and extract exercise science knowledge"
  task process: :environment do
    url = ENV["VIDEO_URL"]
    abort "Usage: rake youtube:process VIDEO_URL=https://youtube.com/watch?v=..." unless url

    service = YoutubeKnowledgeService.new
    video = service.process(url)

    puts "\n=== Video Knowledge ==="
    puts "Title: #{video.title}"
    puts "Summary: #{video.topic_summary}"
    puts "\nKey Takeaways:"
    video.key_takeaways.each_with_index { |t, i| puts "  #{i + 1}. #{t}" }
    puts "\nExercise Insights (#{video.exercise_insights.count}):"
    video.exercise_insights.each do |insight|
      puts "  - #{insight.exercise_name} (#{insight.muscle_group})"
      puts "    Sets: #{insight.recommended_sets}, Reps: #{insight.recommended_reps}, Rest: #{insight.recommended_rest_seconds}s"
      puts "    RPE: #{insight.recommended_rpe}, Confidence: #{insight.confidence}"
      puts "    Insight: #{insight.key_insight}"
    end
    puts "\nTokens used: #{video.prompt_tokens} input, #{video.completion_tokens} output"
  end
end
