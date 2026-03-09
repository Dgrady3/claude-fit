module Api
  module V1
    class ExercisesController < BaseController
      def index
        exercises = Exercise.for_user(current_user)
        search = params[:search] || params[:name]
        exercises = exercises.where("name ILIKE ?", "%#{search}%") if search.present?
        exercises = exercises.where(muscle_group: params[:muscle_group]) if params[:muscle_group].present?
        exercises = exercises.order(:name)

        render_json(ExerciseSerializer, exercises)
      end

      def create
        exercise = current_user.exercises.build(exercise_params)

        if exercise.save
          render_json(ExerciseSerializer, exercise, status: :created)
        else
          render_errors(exercise.errors.full_messages)
        end
      end

      private

      def exercise_params
        params.require(:exercise).permit(:name, :muscle_group, :equipment)
      end
    end
  end
end
