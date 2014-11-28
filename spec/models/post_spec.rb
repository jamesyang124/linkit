require 'rails_helper'

describe Post do
  it { should belong_to(:user) }
  it { should validate_presence_of(:user_id) }
  it { should validate_presence_of(:body) }
  it { should validate_presence_of(:title) }
  it { should validate_presence_of(:link) }
  it { should validate_presence_of(:provider_name) }
  it { should validate_uniqueness_of(:link) }
  

  it "should have thumbnail url and can be nil" do
    link_url = "http://localhost:3000"
    post1 = Fabricate(:post, user: 1, link_url: link_url)
    post2 = Fabricate(:post, user: 2, link_url: link_url << "1", thumbnail_url: "http://localhost:3001")

    expect(Post.find(post1)).to eq(post1)
    expect(Post.find(post2)).to eq(post2)
  end

  it "#save_link" do
    # use real url to test #save_link
    # Use Fabricate.build to get instance before save.
    link_url = "http://google.com"
    post = Post.new(user_id: 1)
    post.save_link link_url

    expect(Post.find(post)).to eq(post)
  end
end