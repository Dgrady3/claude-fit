module Api
  module V1
    class NutritionEntriesController < BaseController
      def index
        entries = current_user.nutrition_entries
        entries = entries.where(date: params[:start_date]..params[:end_date]) if params[:start_date] && params[:end_date]
        entries = entries.for_date(params[:date]) if params[:date]
        entries = entries.order(date: :desc, meal_name: :asc)

        render_json(NutritionEntrySerializer, entries)
      end

      def create
        entry = current_user.nutrition_entries.build(entry_params)

        if entry.save
          render_json(NutritionEntrySerializer, entry, status: :created)
        else
          render_errors(entry.errors.full_messages)
        end
      end

      def destroy
        entry = current_user.nutrition_entries.find(params[:id])
        entry.destroy
        head :no_content
      end

      def import
        unless params[:file].present?
          return render_error("No file provided", status: :bad_request)
        end

        result = MfpImportService.new.call(current_user, params[:file])

        render json: {
          message: "Import complete",
          imported_count: result[:imported],
          skipped: result[:skipped] || 0,
          errors: result[:errors]
        }, status: :ok
      end

      private

      def entry_params
        params.require(:nutrition_entry).permit(
          :date, :meal_name, :food_name, :calories, :protein_g, :carbs_g,
          :fat_g, :fiber_g, :sugar_g, :sodium_mg, :source
        )
      end
    end
  end
end
