class PostsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :redirect_post]

  # root, publicly render.
  def index
    # eager loading
    @posts = Post.includes([:comments, :user]).order('created_at DESC').page(params[:page]).per(9)
    # for query page number over the max page.
    if request_empty_page
      flash[:notice] = "No more posts, post it or back to first page."
      render :index
    end
  end

  def create
    # add link to index?
    if Post.find_by(link: link_params[:link])
      flash[:notice] = "The post link has been shared."
    elsif (link_params[:link]).empty?
      flash[:notice] = "Missing post link."
    else
      @post = Post.new(user_id: current_user.id)
      @post.save_link link_params[:link]
    end
    redirect_to root_path
  end

  def redirect_post
    post = Post.find(params[:post_id])
    redirect_url = post.link

    if redirect_url.nil?
      flash[:error] = "Wrong redirection link."
      
      redirect_to root_path
    else
      post.increment(:click_count, 1).save
      redirect_to redirect_url 
    end
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