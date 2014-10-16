class PostsController < ApplicationController
  before_action :authenticate_user!, except: [:index]

  # root, publicly render.
  def index
    @posts = Post.all
  end

  def create
    @post = Post.new(user_id: current_user.id)
    @post.save_link link_params[:link]

    redirect_to root_path
  end

  private

  def link_params
    params.require(:post).permit(:link)
  end
end