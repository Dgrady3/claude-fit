module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_or_demo!
      before_action :reject_demo_writes!

      private

      def authenticate_or_demo!
        # If request has an Authorization header, use normal Devise JWT auth
        if request.headers['Authorization'].present?
          authenticate_user!
          @demo_mode = false
        else
          # No auth header = demo mode, load demo user
          @current_user = User.find_by(email: "demo@grokfit.dev")
          @demo_mode = true
          head :unauthorized unless @current_user
        end
      end

      def current_user
        @current_user || super
      end

      def demo_user?
        @demo_mode == true
      end

      def reject_demo_writes!
        return unless demo_user?
        return if request.get? || request.head?

        render json: { error: "Demo mode is read-only" }, status: :forbidden
      end

      def render_json(serializer, resource, options = {})
        render json: serializer.new(resource, options).serializable_hash.to_json, status: options[:status] || :ok
      end

      def render_error(message, status: :unprocessable_entity)
        render json: { error: message }, status: status
      end

      def render_errors(errors, status: :unprocessable_entity)
        render json: { errors: errors }, status: status
      end
    end
  end
end
