variable "region" {
  description = "AWS region for the site bucket, API and data. Frankfurt keeps data in the EU."
  type        = string
  default     = "eu-central-1"
}

variable "domain" {
  description = "Site domain. www.<domain> is redirected to it."
  type        = string
  default     = "kosarbarat.hu"
}

variable "sender_domain" {
  description = "Domain the confirmation emails are sent from. Verified in SES through DKIM DNS records."
  type        = string
  default     = "kosarbarat.hu"
}

variable "from_email" {
  description = "Sender address of the confirmation emails. Must be on sender_domain. Replies go to this address, so it should be a real mailbox."
  type        = string
  default     = "info@kosarbarat.hu"
}

variable "from_name" {
  description = "Sender name shown in the inbox."
  type        = string
  default     = "Kosárbarát"
}

variable "github_repository" {
  description = "GitHub repository (owner/name) whose main branch may deploy the site. Empty disables the deploy role."
  type        = string
  default     = "meister245/group-buy-waitlist"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub Actions OIDC provider. Set to false if the AWS account already has one (only one is allowed per account)."
  type        = bool
  default     = true
}

variable "mail_records" {
  description = <<-EOT
    DNS records from the mailbox provider that receives mail for the domain (MX, SPF, verification TXT, DKIM CNAMEs).
    name is relative to the domain ("" for the domain itself). MX values include the priority, e.g. "10 mx1.example.com".
    Records with the same name and type go into one entry.
  EOT
  type = list(object({
    name    = string
    type    = string
    records = list(string)
    ttl     = optional(number, 3600)
  }))
  default = []
}
