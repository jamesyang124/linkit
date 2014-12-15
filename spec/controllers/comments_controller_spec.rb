require 'rails_helper'

describe CommentsController do 
  before(:each) do 
    @current_user = Fabricate(:user)
    @p = Fabricate(:post, user: @current_user.id, link: "url")
    @comment_text = "mock comment"

    # stub current_user for devise helpers.
    allow(controller).to receive(:current_user) { @current_user }

    post :create, post_id: @p.id, comment: {comment: @comment_text }
  end

  context "create a comment #create" do
    it "finds the existed post" do
      expect(Comment.last.commentable_id).to eq(@p.id)
    end

    it "fetch comment from params" do
      expect(Comment.last.comment).to eq(@comment_text)
    end

    it "set commenter to current user" do
      expect(Comment.last.user).to eq(@current_user)
    end

    it "redirect to root path" do
      expect(response).to redirect_to(root_path)
    end

    it "send email to poster and commenters after new comment created" do
      expect(assigns(:res)).not_to be_nil
    end
  end
end