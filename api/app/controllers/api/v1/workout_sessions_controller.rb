module Api
  module V1
    class WorkoutSessionsController < BaseController
      before_action :set_session, only: [:show, :update]

      def index
        sessions = current_user.workout_sessions.order(started_at: :desc)
        sessions = sessions.limit(params[:limit] || 20).offset(params[:offset] || 0)

        render_json(WorkoutSessionSerializer, sessions)
      end

      def show
        program = @session.workout_program
        program_exercises = program&.program_exercises&.includes(:exercise)&.order(:position) || []

        # Build previous sets lookup: for each exercise, find the most recent session's sets
        previous_session = current_user.workout_sessions
          .where(workout_program_id: program&.id)
          .where.not(id: @session.id)
          .where.not(completed_at: nil)
          .order(completed_at: :desc)
          .first

        previous_sets_by_exercise = {}
        if previous_session
          previous_session.session_sets.each do |s|
            previous_sets_by_exercise[s.exercise_id] ||= []
            previous_sets_by_exercise[s.exercise_id] << { weight: s.weight_lbs, reps: s.reps }
          end
        end

        render json: {
          id: @session.id,
          started_at: @session.started_at,
          completed_at: @session.completed_at,
          notes: @session.notes,
          duration: @session.duration,
          total_volume: @session.total_volume,
          workout_program: program ? {
            id: program.id,
            name: program.name,
            description: program.description
          } : nil,
          program_exercises: program_exercises.map do |pe|
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
              },
              previous_sets: previous_sets_by_exercise[pe.exercise_id] || []
            }
          end,
          workout_sets: @session.session_sets.map do |s|
            {
              id: s.id,
              exercise_id: s.exercise_id,
              weight_lbs: s.weight_lbs,
              weight: s.weight_lbs,
              reps: s.reps,
              set_number: s.set_number,
              rpe: s.rpe
            }
          end
        }
      end

      def create
        session = current_user.workout_sessions.build(session_params)
        session.started_at ||= Time.current

        if session.save
          render json: { id: session.id, started_at: session.started_at }, status: :created
        else
          render_errors(session.errors.full_messages)
        end
      end

      def update
        if @session.update(session_params)
          # Return plain JSON so frontend normalizer can read it
          render json: { id: @session.id, completed_at: @session.completed_at }
        else
          render_errors(@session.errors.full_messages)
        end
      end

      private

      def set_session
        @session = current_user.workout_sessions.find(params[:id])
      end

      def session_params
        params.require(:workout_session).permit(:workout_program_id, :started_at,
                                                 :completed_at, :notes)
      end
    end
  end
end
