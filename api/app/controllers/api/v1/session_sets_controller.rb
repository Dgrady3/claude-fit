module Api
  module V1
    class SessionSetsController < BaseController
      before_action :set_workout_session
      before_action :set_session_set, only: [:update, :destroy]

      def create
        set = @workout_session.session_sets.build(set_params)

        if set.save
          render_json(SessionSetSerializer, set, status: :created)
        else
          render_errors(set.errors.full_messages)
        end
      end

      def update
        if @session_set.update(set_params)
          render_json(SessionSetSerializer, @session_set)
        else
          render_errors(@session_set.errors.full_messages)
        end
      end

      def destroy
        @session_set.destroy
        head :no_content
      end

      private

      def set_workout_session
        @workout_session = current_user.workout_sessions.find(params[:workout_session_id])
      end

      def set_session_set
        @session_set = @workout_session.session_sets.find(params[:id])
      end

      def set_params
        params.require(:session_set).permit(:exercise_id, :set_number, :weight_lbs,
                                             :reps, :rpe, :warmup)
      end
    end
  end
end
