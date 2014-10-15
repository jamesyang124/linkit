class PostsController < ApplicationController
  before_action :authenticate_user!, except: [:show]

  def index
    #require 'pry'; binding.pry
    @posts = Post.all
  end

  def show
    @posts = Post.all
    #require 'pry'; binding.pry
    render :index
  end

  def new; end

  def create
    @post = Post.new(user_id: current_user.id)
    @post.save_link link_params[:link]

    redirect_to root_path
  end
  
  # update specifi id's content :post
  def update; end
  # edit specific id's content :get
  def edit; end
  
  def destroy; end

  private

  def link_params
    params.require(:post).permit(:link)
  end
end