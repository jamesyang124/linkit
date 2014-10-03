Linkit::Application.routes.draw do
  root "posts#index"
  resource :posts
end
