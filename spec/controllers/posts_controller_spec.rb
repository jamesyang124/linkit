require 'rails_helper'
require 'spec_helper'

describe PostsController do 
  it "Post#index" do
    get :index
    expect(assigns(:posts)).to eq(Post.all)
  end
end