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

  let(:users) do 
    [Fabricate(:user), Fabricate(:user, email: "email2@email.com"), Fabricate(:user, email: "email3@email.com")].map(&:id)
  end

  it "::find_emails" do
    emails = User.find_emails(users)
    
    expect(emails).not_to be_empty
    expect(emails.map(&:email)).not_to include(nil)
  end

  it "::find_email_names" do
    names = User.find_email_names(users)
    
    expect(names).not_to be_empty
    expect(names.map(&:name)).not_to include(nil)
  end
end