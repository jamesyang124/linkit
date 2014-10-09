Linkit::Application.routes.draw do
  devise_for :users, controllers: {omniauth_callbacks: "users/omniauth_callbacks", registrations: "users/registrations", sessions: "users/sessions"}, skip: [:registrations]

  devise_scope :user do
    post "users" => "users/registrations#create", as: "user_registration"
  end

  as :user do
    get "sign_in", to: "users/sessions#new"
  end

  root "posts#index"
  resources :posts
end
