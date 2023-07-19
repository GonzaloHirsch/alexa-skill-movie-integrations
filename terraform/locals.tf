locals {
  payload_name     = "build.zip"
  function_name    = "alexa-skill-movie-stream"
  target_location  = "../.build/${local.payload_name}"
  package_excludes = [".github", ".git", ".build", "terraform", ".gitignore", "README.md", "LICENSE"]
}
