# Sender domain for the confirmation emails, verified through DKIM records in the
# Route 53 zone (sender_domain must be the site domain or one of its subdomains).

resource "aws_sesv2_email_identity" "sender" {
  email_identity = var.sender_domain
}

resource "aws_route53_record" "dkim" {
  count = 3

  zone_id = aws_route53_zone.main.zone_id
  name    = "${aws_sesv2_email_identity.sender.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.sender_domain}"
  type    = "CNAME"
  ttl     = 1800
  records = ["${aws_sesv2_email_identity.sender.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

# DMARC: mail providers trust DKIM-signed mail more when the domain publishes a policy.
# "p=none" only monitors; tighten to quarantine or reject once sending works.
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.${var.sender_domain}"
  type    = "TXT"
  ttl     = 1800
  records = ["v=DMARC1; p=none"]
}
