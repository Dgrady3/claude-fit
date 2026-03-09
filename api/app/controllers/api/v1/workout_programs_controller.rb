module Api
  module V1
    class WorkoutProgramsController < BaseController
      before_action :set_program, only: [:show, :update, :destroy]

      def index
        programs = current_user.workout_programs.includes(program_exercises: :exercise).order(:name)
        render json: programs.map { |p| program_json(p) }
      end

      def show
        render json: program_json(@program)
      end

      def create
        program = current_user.workout_programs.build(program_params)

        if program.save
          render json: program_json(program), status: :created
        else
          render_errors(program.errors.full_messages)
        end
      end

      def update
        if @program.update(program_params)
          render json: program_json(@program)
        else
          render_errors(@program.errors.full_messages)
        end
      end

      def destroy
        @program.destroy
        head :no_content
      end

      private

      def set_program
        @program = current_user.workout_programs.includes(program_exercises: :exercise).find(params[:id])
      end

      def program_json(program)
        {
          id: program.id,
          name: program.name,
          description: program.description,
          active: program.active,
          program_exercises: program.program_exercises.order(:position).map do |pe|
            {
              id: pe.id,
              exercise_id: pe.exercise_id,
              position: pe.position,
              target_sets: pe.target_sets,
              target_reps: pe.target_reps,
              rest_seconds: pe.rest_seconds,
              exercise: {
                id: pe.exercise.id,
                name: pe.exercise.name,
                muscle_group: pe.exercise.muscle_group
              }
            }
          end
        }
      end

      def program_params
        params.require(:workout_program).permit(
          :name, :description, :active,
          program_exercises_attributes: [:id, :exercise_id, :position, :rest_seconds,
                                         :target_sets, :target_reps, :_destroy]
        )
      end
    end
  end
end
