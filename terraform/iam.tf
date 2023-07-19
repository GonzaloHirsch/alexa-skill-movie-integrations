# Allow assuming the role from the Lambda
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Actual role for the lambda
resource "aws_iam_role" "default" {
  name                = "alexa-skill-movies-lambda-role"
  assume_role_policy  = data.aws_iam_policy_document.assume_role.json
  managed_policy_arns = [aws_iam_policy.dynamo_db.arn, aws_iam_policy.logs.arn]
}

# Policies attached to the role
resource "aws_iam_policy" "dynamo_db" {
  name = "policy-alexa-lambda-dynamod"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ],
        "Resource" : "arn:aws:dynamodb:${var.region}:${var.project_id}:table/*"
      }
    ]
  })
}

resource "aws_iam_policy" "logs" {
  name = "policy-alexa-lambda-execution"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : "logs:CreateLogGroup",
        "Resource" : "arn:aws:logs:${var.region}:${var.project_id}:*"
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : [
          "arn:aws:logs:${var.region}:${var.project_id}:log-group:/aws/lambda/${local.function_name}:*"
        ]
      }
    ]
  })
}
