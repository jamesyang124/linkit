require 'rails_helper'

describe Comment do 
  it { should belong_to(:user) }
  it { should validate_presence_of(:comment) }

  it "has polymorphic association with Post model" do 
    user = Fabricate(:user)
    post = Fabricate(:post, user: user.id, link: "link_url")

    comment = post.comments.create
    comment.comment = "mock comment"
    comment.user_id = user.id
    comment.save

    expect(comment.user).to eq(user)
    expect(comment.commentable_id).to eq(post.id)
    expect(comment.commentable_type).to eq(Post.to_s)
    expect(comment.role).to eq("comments")
  end
end