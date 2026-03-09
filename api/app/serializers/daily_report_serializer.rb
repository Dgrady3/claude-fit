class DailyReportSerializer
  include JSONAPI::Serializer

  attributes :id, :date, :report_type, :analysis_text, :recommendations, :scores,
             :raw_data_snapshot, :model_used, :prompt_tokens, :completion_tokens
end
