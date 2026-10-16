# HTTP API in front of the Lambda functions, with throttling. Visitors reach it
# through CloudFront at https://<domain>/api/*, the same origin as the site, so no CORS is needed.

resource "aws_apigatewayv2_api" "waitlist" {
  name          = local.name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.waitlist.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }
}

resource "aws_apigatewayv2_integration" "fn" {
  for_each = local.functions

  api_id                 = aws_apigatewayv2_api.waitlist.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.fn[each.key].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "fn" {
  for_each = local.functions

  api_id    = aws_apigatewayv2_api.waitlist.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.fn[each.key].id}"
}

resource "aws_lambda_permission" "api" {
  for_each = local.functions

  statement_id  = "AllowApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.waitlist.execution_arn}/*/*"
}
