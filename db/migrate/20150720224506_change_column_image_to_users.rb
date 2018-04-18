class ChangeColumnImageToUsers < ActiveRecord::Migration[5.2]
  def change
    change_column :users, :image, :text, :limit => nil
  end
end
