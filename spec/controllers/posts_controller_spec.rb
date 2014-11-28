require 'rails_helper'

describe PostsController do 
  it_behaves_like "visiter_visited" do 
    let(:action) do 
      get :index 
      expect(assigns(:posts)).to eq(Post.all)
      expect(response).to render_template :index
    end
  end

  context "authentication successd" do
    let(:valid_user) do
      user = Fabricate(:user)
      sign_in :user, user
      user
    end

    it "post#create" do 
      user = valid_user
      link_url = "http://localhost:3000"

      # mock Post#save_link method.
      allow_any_instance_of(Post).to receive(:save_link).with(link_url).and_return(Fabricate(:post, user_id: user.id, link_url: link_url))

      post :create, post: { link: link_url }
      expect(response).to redirect_to root_path
    end 
  end
end