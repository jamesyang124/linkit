require 'rest-client'

class CommentMailService

  def self.broadcast_emails(payload = {})
    # send email to comment group for the post.

    RestClient.post("https://api:#{ENV["mailgun_key"]}@api.mailgun.net/v2/"\
      "sandbox823430410732453a8098c683c455d33a.mailgun.org/messages", payload_params(payload))
  end

  private

  def self.payload_params(payload)
    {
      from: "Linkit <notifications@linkit.com>",
      to: payload[:emails],
      subject: "New comment for post #{payload[:title]}",
      html: payload[:html_str],
      text: "Commenter #{payload[:commenter_name]} left comment:\n #{payload[:comment]}"
    }
  end
end
