class Users::RegistrationsController < Devise::RegistrationsController

  def create
    @user = User.new(create_user)
    if @user.valid?
      @user.save!
      # :signed_up message subject to config/locales/dive.en.yml:registrations
      # add more customed message under :registrations category.
      set_flash_message :notice, :signed_up
      flash.keep :notice
      # redirection from js.
      render js: "window.location.pathname='#{root_path}'"
    else
      respond_to do |format|
        format.js { render :file => "/users/registrations/create.js.erb" }
      end
    end
  end 

  private

  def create_user
    params.require(:user).permit!
  end
end