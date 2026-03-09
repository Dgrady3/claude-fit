module Api
  module V1
    class ProgramExercisesController < BaseController
      before_action :set_program
      before_action :set_program_exercise, only: [:update, :destroy]

      def create
        pe = @program.program_exercises.build(program_exercise_params)

        if pe.save
          render_json(ProgramExerciseSerializer, pe, status: :created)
        else
          render_errors(pe.errors.full_messages)
        end
      end

      def update
        if @program_exercise.update(program_exercise_params)
          render_json(ProgramExerciseSerializer, @program_exercise)
        else
          render_errors(@program_exercise.errors.full_messages)
        end
      end

      def destroy
        @program_exercise.destroy
        head :no_content
      end

      def reorder
        ordered_ids = params[:ordered_ids]
        ordered_ids.each_with_index do |id, index|
          @program.program_exercises.find(id).update!(position: index + 1)
        end

        render json: { message: "Reordered successfully" }, status: :ok
      end

      private

      def set_program
        @program = current_user.workout_programs.find(params[:workout_program_id])
      end

      def set_program_exercise
        @program_exercise = @program.program_exercises.find(params[:id])
      end

      def program_exercise_params
        params.require(:program_exercise).permit(:exercise_id, :position, :rest_seconds,
                                                  :target_sets, :target_reps)
      end
    end
  end
end
