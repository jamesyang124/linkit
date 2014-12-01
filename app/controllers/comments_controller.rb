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
#      require 'pry'; binding.pry
      comment.save
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
end