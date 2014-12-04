class CommentsController < ApplicationController

  # def index; end
  # def show; end
  # def new; end

  def create
    @post = Post.find(params[:post_id])
    if comment_params[:comment]
      comment = @post.comments.create
      comment.comment = comment_params[:comment]
      comment.user = current_user

      comment.save
      # send email to all poster and commenters.
      @res = JSON.parse(send_emails(@post, comment))
    else
      # set error flash
    end
    redirect_to root_path
  end

  # def edit; end
  # def update; end
  # def destroy; end

  private

  def comment_params
    params.require(:comment).permit!
  end

  def send_emails(post, comment)
    mail_params = build_mail_params(post, comment)
    CommentMailService.send_message(mail_params)
  end

  def build_mail_params(post, comment)
    users = post_commenters(post.id)
    emails = mail_list(users)

    # set layout to false, remove default layout template.
    html_str = render_to_string template: "layouts/email_message", layout: false

    {
      users: users,
      mail_list: emails,
      title: post.title,
      image: (post.thumbnail_url || "http://placehold.it/580x300"),
      commenter_name: comment.user.name,
      comment: comment.comment,
      html_str: html_str
    }
  end
end