class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable, :validatable
  devise :omniauthable, :omniauth_providers => [:facebook]

  has_many :posts

  scope :find_emails, ->(users) { select(:email).find(users) }
  scope :find_email_names, ->(users) { select(:name).find_emails(users) }

  def self.from_omniauth(request_auth)
    where(provider: request_auth.provider, uid: request_auth.uid).first_or_create do |user|
      user.email = request_auth.info.email
      user.name = request_auth.info.name
      user.password = Devise.friendly_token[0,20]
      # portrait image url.
      user.image = request_auth.info.image
    end
  end
end
