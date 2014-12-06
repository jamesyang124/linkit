class PostsController < ApplicationController
  before_action :authenticate_user!, except: [:index]

  # root, publicly render.
  def index
    # eager loading
    #count = Post.count
    @posts = Post.includes([:comments, :user]).order('created_at').page(params[:page]).per(4)

    if request_empty_page
      flash[:notice] = "No more posts, redirect back to first page."
      redirect_to root_path
    end
  end

  def create
    @post = Post.new(user_id: current_user.id)
    @post.save_link link_params[:link]

    redirect_to root_path
  end

  private

  # non AJAX call request will redirect to first page
  def request_empty_page
    @posts.empty? && request.env["HTTP_X_REQUESTED_WITH"] != "XMLHttpRequest"
  end

  def link_params
    params.require(:post).permit(:link)
  end
end