require 'rails_helper'

describe User do 
  it { should have_many(:posts) }
  it { should validate_presence_of(:password) }
  it { should validate_presence_of(:email) }
  it { should validate_uniqueness_of(:email) }

  content "register through site" do
    
  end

  context "register through OmniAuth" do
    
  end
end