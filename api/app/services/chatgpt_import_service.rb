class ChatgptImportService
  HEALTH_KEYWORDS = %w[
    workout exercise training gym lift squat bench deadlift press
    diet nutrition protein calories macros carbs fat fiber meal
    sleep recovery rest insomnia melatonin
    supplement creatine vitamin mineral omega
    injury pain knee shoulder back hip
    weight body fat muscle lean bulk cut recomp
    heart rate hrv resting blood pressure cholesterol
    allergy intolerance gluten dairy lactose
    medication prescription doctor diagnosis condition
    anxiety stress cortisol mental health
    testosterone hormone thyroid insulin glucose
    surgery procedure rehab physical therapy
    cardio running cycling swimming HIIT
    flexibility mobility stretching yoga
    hydration water electrolytes sodium
    goal target progress plateau
  ].freeze

  def call(user, file)
    json = JSON.parse(file.read)
    conversations = extract_health_conversations(json)
    insights = extract_health_insights(conversations)
    save_contexts(user, insights)
  end

  private

  def extract_health_conversations(json)
    # ChatGPT export format: array of conversation objects
    # Each has "title" and "mapping" with message nodes
    conversations = json.is_a?(Array) ? json : [json]

    conversations.select do |convo|
      next false unless convo.is_a?(Hash) && convo["mapping"]

      messages_text = extract_messages_text(convo)
      health_relevant?(messages_text)
    end
  end

  def extract_messages_text(convo)
    messages = []
    convo["mapping"]&.each_value do |node|
      msg = node.dig("message")
      next unless msg
      parts = msg.dig("content", "parts")
      next unless parts.is_a?(Array)

      text = parts.select { |p| p.is_a?(String) }.join(" ")
      messages << text if text.present?
    end
    messages.join(" ")
  end

  def health_relevant?(text)
    lower = text.downcase
    matched = HEALTH_KEYWORDS.count { |kw| lower.include?(kw) }
    matched >= 3
  end

  def extract_health_insights(conversations)
    insights = Hash.new { |h, k| h[k] = [] }

    conversations.each do |convo|
      title = convo["title"] || "Untitled"
      created = parse_timestamp(convo["create_time"])
      messages = extract_assistant_messages(convo)

      messages.each do |msg|
        category = categorize_message(msg)
        next unless category

        insights[category] << {
          content: truncate_content(msg),
          date: created,
          title: title
        }
      end
    end

    insights
  end

  def extract_assistant_messages(convo)
    messages = []
    convo["mapping"]&.each_value do |node|
      msg = node.dig("message")
      next unless msg
      next unless msg.dig("author", "role") == "assistant"

      parts = msg.dig("content", "parts")
      next unless parts.is_a?(Array)

      text = parts.select { |p| p.is_a?(String) }.join("\n")
      messages << text if text.present? && health_relevant?(text)
    end
    messages
  end

  def categorize_message(text)
    lower = text.downcase

    if lower.match?(/injur|pain|rehab|physical therapy|surgery|procedure/)
      "injuries"
    elsif lower.match?(/supplement|creatine|vitamin|omega|mineral|magnesium|zinc/)
      "supplements"
    elsif lower.match?(/allerg|intoleran|gluten|dairy|lactose/)
      "allergies"
    elsif lower.match?(/medicat|prescription|doctor|diagnosis|condition|thyroid|insulin/)
      "medical_history"
    elsif lower.match?(/sleep|insomnia|melatonin|recovery|rest day/)
      "lifestyle"
    elsif lower.match?(/goal|target|progress|plateau|bulk|cut|recomp/)
      "goals"
    elsif lower.match?(/prefer|routine|schedule|split/)
      "preferences"
    elsif lower.match?(/diet|nutrition|protein|calories|macros|meal|carbs|fat|fiber/)
      "general_health"
    elsif lower.match?(/workout|exercise|training|gym|lift|squat|bench|deadlift/)
      "general_health"
    else
      nil
    end
  end

  def truncate_content(text)
    # Keep to ~2000 chars to avoid bloating prompts
    text.length > 2000 ? text[0..1997] + "..." : text
  end

  def parse_timestamp(ts)
    return nil unless ts
    Time.at(ts).to_date
  rescue StandardError
    nil
  end

  def save_contexts(user, insights)
    imported = 0
    skipped = 0

    insights.each do |category, items|
      # Merge items into a single context per category
      combined = items.map { |i| "### #{i[:title]}\n#{i[:content]}" }.join("\n\n---\n\n")
      combined = truncate_content(combined) if combined.length > 8000

      existing = user.health_contexts.find_by(category: category, source: "chatgpt_import")
      if existing
        # Append new content
        merged = "#{existing.content}\n\n---\n\n#{combined}"
        merged = merged.last(8000) if merged.length > 8000
        existing.update!(content: merged)
        imported += 1
      else
        user.health_contexts.create!(
          category: category,
          content: combined,
          source: "chatgpt_import",
          context_date: items.first[:date]
        )
        imported += 1
      end
    rescue StandardError => e
      skipped += 1
      Rails.logger.warn("ChatGPT import error for #{category}: #{e.message}")
    end

    { imported: imported, skipped: skipped, categories: insights.keys }
  end
end
