class Users::RegistrationsController < Devise::RegistrationsController

  def create
    # use form tag, does not require strong params.
    @user = User.new(name: params[:name], email: params[:email], password: params[:password])
    if @user.valid?
      @user.save!
      # :signed_up message subject to config/locales/dive.en.yml:registrations
      # add more customed message under :registrations category.
      set_flash_message :notice, :signed_up
      redirect_to root_path
    else
      set_flash_message :error, :registration_failed
      redirect_to root_path
    end
  end 
end