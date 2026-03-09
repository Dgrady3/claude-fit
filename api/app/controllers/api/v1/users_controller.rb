module Api
  module V1
    class UsersController < BaseController
      def show
        render_json(UserSerializer, current_user)
      end

      def update
        if current_user.update(user_params)
          render_json(UserSerializer, current_user)
        else
          render_errors(current_user.errors.full_messages)
        end
      end

      private

      def user_params
        params.require(:user).permit(:name, :body_weight_lbs, :height_inches, :age, :sex)
      end
    end
  end
end
