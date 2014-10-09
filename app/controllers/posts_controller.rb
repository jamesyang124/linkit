class PostsController < ApplicationController
  def index
    @posts = Post.all
  end

  def show; end
  def new; end
  def create; end
  
  # update specifi id's content :post
  def update; end
  # edit specific id's content :get
  def edit; end
  
  def destroy; end
end