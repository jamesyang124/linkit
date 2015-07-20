class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController

  # it is called fater facebook authentication permitted.
  def facebook
    @user = User.from_omniauth(request.env["omniauth.auth"])
    if @user.persisted?
      set_flash_message(:notice, :success, :kind => "Facebook")
      sign_in_and_redirect @user
    else
      session["devise.facebook_data"] = request.env["omniauth.auth"].except(:extra)
      set_flash_message(:warning, :failure, :kind => "Facebook", :reason => "permissions are required.")
      redirect_to root_path
    end
  end
end