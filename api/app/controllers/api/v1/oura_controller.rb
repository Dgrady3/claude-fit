module Api
  module V1
    class OuraController < BaseController
      def authorize
        url = OuraOauthService.new.authorize_url(current_user)
        redirect_to url, allow_other_host: true
      end

      def callback
        result = OuraOauthService.new.exchange_code(current_user, params[:code])

        if result[:error]
          redirect_to "#{frontend_url}/settings?oura=error", allow_other_host: true
          return
        end

        OuraSyncService.new.call(current_user)
        redirect_to "#{frontend_url}/settings?oura=connected", allow_other_host: true
      end

      def sync
        result = OuraSyncService.new.call(current_user)

        if result[:error]
          render_error(result[:error])
        else
          render json: { success: true }
        end
      end

      private

      def frontend_url
        ENV.fetch("FRONTEND_URL", "http://localhost:5173")
      end
    end
  end
end
