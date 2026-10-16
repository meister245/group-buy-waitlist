# Kosárbarát: the static site (S3 + CloudFront) and the waitlist API
# (API Gateway + Lambda + DynamoDB + SES), served together on one domain.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.69"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
  }

  # State is stored locally by default. For a shared setup, use an S3 backend:
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "kosarbarat/waitlist.tfstate"
  #   region = "eu-central-1"
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project = "kosarbarat-waitlist"
    }
  }
}

# CloudFront only accepts certificates from us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project = "kosarbarat-waitlist"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  name     = "kosarbarat-waitlist"
  site_url = "https://${var.domain}/"

  # Lambda handler name => HTTP route. CloudFront forwards /api/* to the API unchanged.
  functions = {
    signup      = "POST /api/signup"
    confirm     = "GET /api/confirm"
    unsubscribe = "GET /api/unsubscribe"
  }
}
