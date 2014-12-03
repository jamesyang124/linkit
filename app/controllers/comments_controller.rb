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
      @res = broadcast_emails(@post.id, @post.title, comment.comment, comment.user.name)
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

  def broadcast_emails(post_id, title, comment, commenter_name)
    users = post_comment_users(post_id)
    emails = user_emails(users)
    html_str = render_to_string template: "layouts/email_message"

    payload = {
      html: html_str,
      comment: comment,
      emails: emails,
      title: title,
      commenter_name: commenter_name
    }

    CommentMailService.broadcast_emails(payload)
  end
end