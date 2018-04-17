class CommentsController < ApplicationController
  before_action :authenticate_user!

  def create
    @post = Post.find(params[:post_id])
    if !comment_params[:comment].empty?
      comment = @post.comments.create
      comment.comment = comment_params[:comment]
      comment.user = current_user

      @post.increment(:comments_count)
      comment.save
      # send email to all poster and commenters.
      @res = send_emails(@post, comment)

      respond_to do |format|
        format.html { redirect_to root_path }
        format.js { render file: "/posts/ajax_comment.js.erb", layout: false }
      end
    else
      # set error flash
      #flash[:notice] = "Comment cannot be blank."
      redirect_to :back
    end
  end

  private

  def comment_params
    params.require(:comment).permit!
  end

  def send_emails(post, comment)
    mail_params = build_mail_params(post, comment)
    CommentMailService.perform_async(mail_params)
  end

  # sidekiq allows simple JSON type hash, string, array, integer
  # Make the hash only with those data types, do not use symbol.
  def build_mail_params(post, comment)
    users = post_commenters(post.id)
    emails = mail_list(users)

    # set layout to false, remove default layout template.
    html_str = render_to_string template: "layouts/email_message", layout: false

    {
      "users" => users,
      "mail_list" => emails,
      "title" => post.title,
      "image" => (post.thumbnail_url || "http://placehold.it/580x300"),
      "commenter_name" => comment.user.name,
      "comment" => comment.comment,
      "html_str" => html_str
    }
  end
end
