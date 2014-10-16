Linkit::Application.routes.draw do
  root "posts#index"
  
  devise_for :users, controllers: {omniauth_callbacks: "users/omniauth_callbacks", registrations: "users/registrations", sessions: "users/sessions"}, skip: [:registrations, :sessions]

  devise_scope :user do
    post "users" => "users/registrations#create", as: "user_registration"
    post "users/sign_in" => "users/sessions#create", as: "user_session"
    delete "users/sign_out" => "users/sessions#destroy", as: "destroy_user_session"
  end

  resources :posts, except: [:show, :new, :edit, :update]
end
