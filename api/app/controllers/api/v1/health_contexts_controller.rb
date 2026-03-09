module Api
  module V1
    class HealthContextsController < BaseController
      def index
        contexts = current_user.health_contexts.recent
        render json: { data: contexts.as_json(only: [:id, :category, :content, :source, :context_date, :created_at, :updated_at]) }
      end

      def import
        unless params[:file].present?
          return render_error("No file provided", status: :bad_request)
        end

        result = ChatgptImportService.new.call(current_user, params[:file])

        render json: {
          message: "Import complete",
          imported_count: result[:imported],
          skipped: result[:skipped],
          categories: result[:categories]
        }, status: :ok
      end

      def destroy
        context = current_user.health_contexts.find(params[:id])
        context.destroy
        head :no_content
      end
    end
  end
end
