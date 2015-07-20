class ChangeColumnImageToUsers < ActiveRecord::Migration
  def change
    change_column :users, :image, :text, :limit => nil
  end
end
