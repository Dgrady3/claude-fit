class ClaudeClient
  attr_reader :client

  def initialize
    @client = Anthropic::Client.new(
      api_key: ENV["ANTHROPIC_API_KEY"]
    )
  end

  def chat(system:, messages:, model: "claude-sonnet-4-20250514", max_tokens: 4096)
    response = client.messages.create(
      model: model,
      max_tokens: max_tokens,
      system: system,
      messages: messages
    )

    {
      content: response.content.first.text,
      model: response.model,
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens
    }
  end
end
