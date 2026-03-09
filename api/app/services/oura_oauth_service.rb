class OuraOauthService
  AUTH_URL = "https://cloud.ouraring.com/oauth/authorize".freeze
  TOKEN_URL = "https://api.ouraring.com/oauth/token".freeze

  def authorize_url(user)
    params = {
      response_type: "code",
      client_id: ENV["OURA_CLIENT_ID"],
      redirect_uri: redirect_uri,
      scope: "daily heartrate workout tag session personal",
      state: user.id
    }

    "#{AUTH_URL}?#{params.to_query}"
  end

  def exchange_code(user, code)
    response = token_connection.post(TOKEN_URL) do |req|
      req.body = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri,
        client_id: ENV["OURA_CLIENT_ID"],
        client_secret: ENV["OURA_CLIENT_SECRET"]
      }
    end

    return { error: "Token exchange failed" } unless response.success?

    data = response.body
    token = user.oauth_tokens.find_or_initialize_by(provider: "oura")
    token.update!(
      access_token: data["access_token"],
      refresh_token: data["refresh_token"],
      expires_at: Time.current + data["expires_in"].to_i.seconds,
      scope: data["scope"]
    )

    { success: true }
  end

  def refresh_token(user)
    token = user.oauth_tokens.find_by(provider: "oura")
    return { error: "No token found" } unless token

    response = token_connection.post(TOKEN_URL) do |req|
      req.body = {
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
        client_id: ENV["OURA_CLIENT_ID"],
        client_secret: ENV["OURA_CLIENT_SECRET"]
      }
    end

    return { error: "Token refresh failed" } unless response.success?

    data = response.body
    token.update!(
      access_token: data["access_token"],
      refresh_token: data["refresh_token"],
      expires_at: Time.current + data["expires_in"].to_i.seconds
    )

    { success: true }
  end

  private

  def redirect_uri
    ENV.fetch("OURA_REDIRECT_URI", "http://localhost:3000/api/v1/oauth/oura/callback")
  end

  def token_connection
    Faraday.new do |f|
      f.request :url_encoded
      f.response :json
    end
  end
end
