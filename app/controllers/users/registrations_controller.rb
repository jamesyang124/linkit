class Users::RegistrationsController < Devise::RegistrationsController
  def create
    require 'pry'; binding.pry
    redirect_to root_path
  end 
end