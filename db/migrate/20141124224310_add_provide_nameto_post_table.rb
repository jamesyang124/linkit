class AddProvideNametoPostTable < ActiveRecord::Migration[5.2]
  def change
    add_column :posts, :provider_name, :string
  end
end
