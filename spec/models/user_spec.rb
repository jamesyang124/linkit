require 'rails_helper'

describe User do 
  it { should have_many(:posts) }
  it { should validate_presence_of(:password) }
  it { should validate_presence_of(:email) }
  it { should validate_uniqueness_of(:email) }

  
  it "allowed register without omniauth." do
    user = Fabricate(:user)
    expect(User.last).to eq(user)
  end

  it "reigster through omniauth" do
    request_auth = double(:request_auth)
    allow(request_auth).to receive_messages(:provider => "facebook", :uid => "uid")
    allow(request_auth).to receive_message_chain("info.email") { "info_email@info.com" }
    allow(request_auth).to receive_message_chain("info.name") { "Info Name" }
    allow(request_auth).to receive_message_chain("info.image") { "http://info.mage" }

    user = User.from_omniauth(request_auth)
    expect(User.last).to eq(user)
  end
end