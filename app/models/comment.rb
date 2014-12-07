class Comment < ActiveRecord::Base

  include ActsAsCommentable::Comment

  belongs_to :commentable, :polymorphic => true, counter_cache: true

  default_scope -> { order('created_at ASC') }
  validates_presence_of :comment

  # NOTE: install the acts_as_votable plugin if you
  # want user to vote on the quality of comments.
  #acts_as_voteable

  # NOTE: Comments belong to a user
  belongs_to :user

  scope :post_commenters, ->(post_id) { select(:user_id).where(commentable_id: post_id) }
end
