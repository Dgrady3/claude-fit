module Api
  module V1
    module Auth
      class RegistrationsController < Devise::RegistrationsController
        respond_to :json

        private

        def respond_with(resource, _opts = {})
          if resource.persisted?
            token = request.env["warden-jwt_auth.token"]
            render json: {
              user: UserSerializer.new(resource).serializable_hash[:data][:attributes],
              token: token
            }, status: :ok
          else
            render json: {
              error: "User could not be created.",
              errors: resource.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        def sign_up_params
          params.require(:user).permit(:email, :password, :password_confirmation, :name,
                                       :body_weight_lbs, :height_inches, :age, :sex)
        end
      end
    end
  end
end
