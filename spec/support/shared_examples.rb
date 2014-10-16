shared_examples "visiter_visited" do 
  it 'render to root path' do 
    sign_out :user
    action
  end
end