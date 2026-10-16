output "site_url" {
  value = local.site_url
}

output "name_servers" {
  description = "Set these as the domain's name servers at the registrar."
  value       = aws_route53_zone.main.name_servers
}

# GitHub repository variables for the deploy workflow (Settings → Secrets and variables → Actions → Variables).
output "github_variables" {
  value = {
    AWS_DEPLOY_ROLE_ARN        = local.deploy_enabled ? aws_iam_role.deploy[0].arn : null
    SITE_BUCKET                = aws_s3_bucket.site.bucket
    CLOUDFRONT_DISTRIBUTION_ID = aws_cloudfront_distribution.site.id
  }
}

output "table_name" {
  value = aws_dynamodb_table.waitlist.name
}
