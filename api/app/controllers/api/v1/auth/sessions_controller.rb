module Api
  module V1
    module Auth
      class SessionsController < Devise::SessionsController
        respond_to :json

        private

        def respond_with(resource, _opts = {})
          token = request.env["warden-jwt_auth.token"]
          render json: {
            user: UserSerializer.new(resource).serializable_hash[:data][:attributes],
            token: token
          }, status: :ok
        end

        def respond_to_on_destroy
          if current_user
            render json: { message: "Logged out successfully." }, status: :ok
          else
            render json: { error: "Couldn't find an active session." }, status: :unauthorized
          end
        end
      end
    end
  end
end
