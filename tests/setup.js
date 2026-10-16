process.env.NODE_ENV = "test";
process.env.PORT = "8001";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.RESPONSE_TOKEN_SECRET = "test-response-secret";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
process.env.REFRESH_TOKEN_EXPIRATION = "7d";
process.env.JWT_EXPIRATION = "1h";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";
process.env.FIREBASE_CONFIG_BASE64 = Buffer.from(
  JSON.stringify({
    type: "service_account",
    project_id: "test-project",
    private_key_id: "test-key-id",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n",
    client_email: "firebase@test-project.iam.gserviceaccount.com",
    client_id: "123",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase%40test-project.iam.gserviceaccount.com",
  }),
).toString("base64");
