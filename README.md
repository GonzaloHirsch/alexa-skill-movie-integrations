# Movie Map

This guide assists in the development of an Alexa skill, focusing on the given example of this skill.

- [Infrastructure](#infrastructure)
  - [Necessary IAM Permissions for CI/CD](#necessary-iam-permissions-for-cicd)
  - [Variables](#variables)
  - [Running Terraform](#running-terraform)
  - [Testing Deployment Account for CI/CD Locally](#testing-deployment-account-for-cicd-locally)
- [Codebase](#codebase)
  - [Dependencies](#dependencies)
  - [Development \& Testing](#development--testing)
  - [Skill Handler](#skill-handler)
  - [Intent Handler](#intent-handler)
  - [Other Files](#other-files)
- [Skill Configuration](#skill-configuration)
- [Workflows](#workflows)

## Infrastructure

All infrastructure is deployed using Terraform (except the IAM Users and policies required to deploy via Terraform). All the terraform files live on the `terraform` directory. Necessary resources are:

- `archive_file` --> Allows zipping the contents of the Lambda Function.
- `aws_lambda_function` --> Lambda Function that handles the user inquiry via Alexa.
- `aws_lambda_permission` --> Permissions to invoke the Lambda Function. This includes verification via the skill ID.
- `aws_cloudwatch_log_group` --> Log Group in CloudWatch to store logs for the Lambda Function.
- `aws_s3_bucket` --> Storage for the Terraform state. Note this is not necessary if you intend on working exclusively with local state, but this will not work correctly with a CI/CD pipeline.
- `aws_iam_role` --> IAM Role to allow invoking the necessary resources for the Lambda Function.
- `aws_iam_policy` --> Two IAM Policies for the necessary permissions.
- `aws_iam_policy_document` --> IAM Policy Document that allows Lambda to assume the given role.

### Necessary IAM Permissions for CI/CD

These are the necessary permissions to correctly deploy the stack in a CI/CD pipeline after deploying most of the resources with an account with enough permissions. Permissions are broken down on several IAM policies for simplicity:

- `policy-alexa-iam-deployer`

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EditPermissions",
            "Effect": "Allow",
            "Action": [
                "iam:GetRole",
                "iam:GetPolicyVersion",
                "iam:ListRoleTags",
                "iam:UntagRole",
                "iam:GetPolicy",
                "iam:TagRole",
                "iam:UpdateRoleDescription",
                "iam:CreateRole",
                "iam:PutRolePolicy",
                "iam:TagPolicy",
                "iam:CreatePolicy",
                "iam:PassRole",
                "iam:ListPolicyVersions",
                "iam:ListAttachedRolePolicies",
                "iam:UntagPolicy",
                "iam:UpdateRole",
                "iam:ListRolePolicies",
                "iam:GetRolePolicy"
            ],
            "Resource": [
                "arn:aws:iam::REDACTED_ACCOUNT_ID:policy/policy-alexa-lambda-dynamod",
                "arn:aws:iam::REDACTED_ACCOUNT_ID:policy/policy-alexa-lambda-execution",
                "arn:aws:iam::REDACTED_ACCOUNT_ID:role/alexa-skill-movies-lambda-role"
            ]
        },
        {
            "Sid": "ListPermissions",
            "Effect": "Allow",
            "Action": [
                "iam:ListPolicies",
                "iam:ListRoles"
            ],
            "Resource": "*"
        }
    ]
}
```

- `policy-alexa-lambda-deployer`

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EditPermissions",
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:TagResource",
                "lambda:ListVersionsByFunction",
                "lambda:GetFunction",
                "lambda:UpdateFunctionConfiguration",
                "lambda:UntagResource",
                "lambda:GetFunctionCodeSigningConfig",
                "lambda:UpdateFunctionCode",
                "iam:PassRole",
                "lambda:AddPermission",
                "lambda:ListTags",
                "lambda:RemovePermission",
                "lambda:GetPolicy"
            ],
            "Resource": [
                "arn:aws:lambda:REDACTED_REGION:REDACTED_ACCOUNT_ID:function:alexa-skill-movie-stream",
                "arn:aws:iam::REDACTED_ACCOUNT_ID:role/alexa-skill-movies-lambda-role"
            ]
        },
        {
            "Sid": "ListPermissions",
            "Effect": "Allow",
            "Action": "lambda:ListFunctions",
            "Resource": "*"
        }
    ]
}
```

- `policy-alexa-logs-deployer`

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EditPermissions",
            "Effect": "Allow",
            "Action": [
                "logs:ListTagsLogGroup",
                "logs:TagLogGroup",
                "logs:UntagLogGroup",
                "logs:CreateLogGroup"
            ],
            "Resource": "arn:aws:logs:REDACTED_REGION:REDACTED_ACCOUNT_ID:log-group:/aws/lambda/alexa-skill-movie-stream:*"
        },
        {
            "Sid": "ListPermissions",
            "Effect": "Allow",
            "Action": "logs:DescribeLogGroups",
            "Resource": "*"
        }
    ]
}
```

- `policy-alexa-s3-deployer`

Note in this case that several permissions are necessary for Terraform to interact with the backend where the state lives.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EditPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObjectAcl",
                "s3:GetObject",
                "s3:PutBucketTagging",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::alexa-skill-terraform-backend/*",
                "arn:aws:s3:::alexa-skill-terraform-backend"
            ]
        },
        {
            "Sid": "GetPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:GetEncryptionConfiguration",
                "s3:GetLifecycleConfiguration",
                "s3:Get*Configuration",
                "s3:GetAccelerateConfiguration",
                "s3:GetBucket*"
            ],
            "Resource": [
                "arn:aws:s3:::alexa-skill-terraform-backend",
                "arn:aws:s3:REDACTED_REGION:REDACTED_ACCOUNT_ID:storage-lens/*"
            ]
        }
    ]
}
```

### Variables

A `terraform.tfvars` file is heavily encouraged as to simplify the development process and secret management. The contents should be the following:

```
account_id  = "XXXX"
region      = "XXXX"
backend_url = "XXXX"
backend_key = "XXXX"
skill_id    = "ALEXA_SKILL_ID"
```

### Running Terraform

If you intend to run Terraform for the first time before migrating the state to a backend. Follow these steps:

1. Initialize the stack (`terraform init`).
2. Temporarily remove the `backend.tf` file from your configuration.
3. Run the stack (`terraform apply`).
4. Add back the `backend.tf` file.
5. Initialize the stack again (`terraform init`) and opt to migrate the state to the backend.

### Testing Deployment Account for CI/CD Locally

To configure a specific profile, use the following command and following the instructions:

```bash
aws configure --profile alexa-deployer
```

Once the profile is set, create an environment variable for the AWS profile:

```bash
export AWS_PROFILE="alexa-deployer"
```

Then you can reconfigure Terraform with `terraform init -reconfigure` and run the init or plan commands to see if the account has enough permissions.

## Codebase

### Dependencies

Start by installing all dependencies:

```
npm i
```

### Development & Testing

It is possible to debug the Lambda function locally, but is simpler to do it using the Alexa inteface. In case you want to debug locally, follow this [guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-invoke.html).

### Skill Handler

The skill handler (`src/index.js`) is very simple to configure, as it mostly involves importing the intent handlers and adding them as possible request handlers.

```javascript
const Alexa = require('ask-sdk-core');
const {
  // ... handlers
} = require('./handlers');

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers
  // ... handlers
  ()
  .addErrorHandlers(ErrorHandler)
  // API Client to use other features from Alexa
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
```

Intent handlers are the handlers that take care of each of the requests that a user might generate.

### Intent Handler

All intent handlers live on `src/handlers` as `something.handler.js` for organization. All handlers have the same structure:

```javascript
const CustomHandler = {
  // Determines whether this handler can actually handle the intent or not
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'MyCustomIntent'
    );
  },
  // Actually handles the intent and does something
  handle(handlerInput) {
    const speechText = `My custom speech text`;
    const cardText = `My custom card text`;

    // Returns a special Alexa response
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(cardText, speechText)
      .getResponse();
  }
};

module.exports = CustomHandler;
```

### Other Files

Files within `src/utils` and `src/locales` are mostly utilities to help with the development.

## Skill Configuration

## Workflows

This repository contains 3 main workflows:

1. [`automatic-release`](.github/workflows/automatic-release.yml) --> Runs the Terraform stack to deploy changes and generates a new release with release notes.
2. [`linting`](.github/workflows/linting.yml) --> Lints the JavaScript code to make sure it follows a consistent format.
3. [`testing`](.github/workflows/testing.yml) --> Validates the Terraform stack to make sure format and contents are valid.

There is an extra workflow, but this is automatically added by GitHub Pages to build the page.
