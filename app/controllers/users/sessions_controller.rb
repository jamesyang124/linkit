class Users::SessionsController < Devise::SessionsController
  before_action :authenticate_user!, only: [:create]

  def create
    if user_signed_in?
      set_flash_message :notice, :signed_in
      render js: "window.location.href='#{root_path}'"
    else
      respond_to do |format|
        format.js { render file: "users/sessions/create.js.erb" }
      end
    end
  end

  # log out
  def destroy
    super
  end
end