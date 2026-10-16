# Sign-ups, keyed by email. Confirm and unsubscribe links look items up by token.

resource "aws_dynamodb_table" "waitlist" {
  name         = local.name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "token"
    type = "S"
  }

  global_secondary_index {
    name            = "token-index"
    projection_type = "ALL"

    key_schema {
      attribute_name = "token"
      key_type       = "HASH"
    }
  }

  # Every sign-up carries expiresAt and is deleted automatically:
  # 7 days after sign-up if unconfirmed, 12 months after confirmation otherwise.
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
