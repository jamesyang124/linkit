Linkit::Application.routes.draw do
  devise_for :users, controllers: {omniauth_callbacks: "users/omniauth_callbacks", registrations: "users/registrations", sessions: "users/sessions"}, skip: [:registrations]

  devise_scope :user do
    post "users" => "users/registrations#create", as: "user_registration"
    #get "users" => "users/registrations#new", as: "new_user_registration"
  end

  root "posts#index"
  resources :posts
end
