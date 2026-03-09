Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users,
    path: "api/v1/auth",
    path_names: { sign_in: "sign_in", sign_out: "sign_out", registration: "" },
    controllers: {
      registrations: "api/v1/auth/registrations",
      sessions: "api/v1/auth/sessions"
    }

  namespace :api do
    namespace :v1 do
      resource :user, only: [:show, :update]
      get :me, to: "users#show"
      patch :me, to: "users#update"

      resources :exercises, only: [:index, :create]

      resources :workout_programs do
        resources :program_exercises, only: [:create, :update, :destroy] do
          collection do
            patch :reorder
          end
        end
      end

      resources :workout_sessions, only: [:index, :show, :create, :update] do
        resources :session_sets, only: [:create, :update, :destroy]
      end

      resources :nutrition_entries, only: [:index, :create, :destroy] do
        collection do
          post :import
        end
      end

      resources :daily_reports, only: [:index, :show] do
        collection do
          post :generate
          post :generate_weekly
        end
      end

      resources :anomalies, only: [:index] do
        member do
          patch :dismiss
        end
      end

      resources :health_contexts, only: [:index, :destroy] do
        collection do
          post :import
        end
      end

      get "readiness/today", to: "readiness#today"
      get "insights/root_cause", to: "insights#root_cause"
      get "metrics", to: "metrics#index"
      get "athlete_card", to: "athlete_card#show"

      # Oura OAuth
      get "oura/authorize", to: "oura#authorize"
      get "oauth/oura/callback", to: "oura#callback"
      post "oura/sync", to: "oura#sync"
    end
  end
end
