class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  helper_method :post_comment_users, :user_emails

  private

  # session redirection
  def after_sign_in_path_for(resource_or_scope)
    posts_path
  end

  def after_sign_out_path_for(resource_or_scope)
    posts_path
  end

  # omniauth failed redirect back.
  def new_session_path(scope)
    root_path
  end

  def post_comment_users(post_id = nil)
    Comment.post_comments(post_id).map(&:user_id).uniq
  end

  def mail_list(users = [])
    User.find_emails(users).map(&:email).join(", ")
  end
end
