variable "account_id" {
  type        = string
  description = "ID of the AWS project."
}
variable "profile" {
  type        = string
  description = "Profile for the AWS account to be used."
}
variable "region" {
  type        = string
  description = "Region of the resources."
}
variable "backend_url" {
  type        = string
  description = "URL of the backend service."
}
variable "backend_key" {
  type        = string
  description = "API key for the backend service."
}
