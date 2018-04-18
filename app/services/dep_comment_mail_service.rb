class DepCommentMailService < ApplicationController

  def self.send_message(mail_params = {})
    require 'rest-client'
    # send email to comment group for the post.

    RestClient.post "https://api:#{ENV["mailgun_key"]}@api.mailgun.net/v2/#{ENV["mailgun_domain"]}/messages", post_params(mail_params)
  end

  private

  def self.post_params(mail_params)
    payload = build_payload(mail_params)

    payload["from"] = "Linkit <notifications@linkit.com>"
    payload["to"] = payload.delete "mail_list"
    payload["subject"] = "New comment for post - #{payload["title"]}"
    payload["text"] = "Commenter #{payload["commenter_name"]} left comment:\n #{payload["comment"]}"
    payload["html"] = payload.delete "html_str"
    payload.delete "commenter_name"
    payload.delete "comment"
    payload.delete "title"
    payload
  end

  def self.build_payload(mail_params = {})
    recipient_variables = {}
    User.find_email_names(mail_params["users"]).each do |u|
      recipient_variables[u.email] = {
        "name" => u.name,
        "commenter" => mail_params["commenter_name"],
        "title" => mail_params["title"],
        "comment" => mail_params["comment"],
        "image" => mail_params["image"]
      }
    end

    mail_params.delete "users"
    # conver hash to JSON string.
    mail_params["recipient-variables"] = JSON.generate(recipient_variables)
    mail_params
  end
end
