require 'rails_helper'

describe Comment do 
  it { should belong_to(:user) }

  it "has polymorphic association with Post model" do 

  end
end