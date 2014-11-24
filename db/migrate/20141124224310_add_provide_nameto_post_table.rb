class AddProvideNametoPostTable < ActiveRecord::Migration
  def change
    add_column :posts, :provider_name, :string
  end
end
