# Public DNS zone for the domain. The domain is registered elsewhere: set the
# name servers from the name_servers output at the registrar (see the README).

resource "aws_route53_zone" "main" {
  name    = var.domain
  comment = "Kosárbarát"

  # Recreating the zone would change its name servers and break the delegation at the registrar.
  lifecycle {
    prevent_destroy = true
  }
}

# Mailbox provider records (info@<domain> is received by an external provider, not by AWS).
resource "aws_route53_record" "mail" {
  for_each = { for r in var.mail_records : "${r.name}-${r.type}" => r }

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name == "" ? var.domain : "${each.value.name}.${var.domain}"
  type    = each.value.type
  ttl     = each.value.ttl
  records = each.value.records
}
