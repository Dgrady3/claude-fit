module Api
  module V1
    class InsightsController < BaseController
      def root_cause
        result = RootCauseService.new.call(current_user)
        render json: result
      end
    end
  end
end
