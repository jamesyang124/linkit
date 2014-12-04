require 'rails_helper'

describe Comment do 
  it { should belong_to(:user) }
  it { should validate_presence_of(:comment) }

  it "has polymorphic association with Post model(:set)" do 
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

  it "::post_commenters" do
    user = Fabricate(:user)
    post = Fabricate(:post, user: user.id, link: "link_url")
    
    (1).upto(5) do |i|
      comment = post.comments.create
      comment.comment = "mock comment number #{i}"
      comment.user_id = user.id
      comment.save
    end

    commenters = Comment.post_commenters(post.id)
    expect(commenters).not_to be_empty
    expect(commenters.map(&:user_id)).not_to be_nil
  end
end