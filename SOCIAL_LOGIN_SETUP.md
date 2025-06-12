# Social Login Integration Setup

This document provides instructions on how to set up Google, Apple, and LinkedIn social login integrations for the Teacher's Lounge application.

## Prerequisites

- An Expo account (for configuring OAuth URIs)
- A Google Developer account
- An Apple Developer account (required for Apple Sign in)
- A LinkedIn Developer account

## Google Sign-In Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add your app's Expo redirect URI to the "Authorized redirect URIs" field:
   - Format: `https://auth.expo.io/@your-expo-username/teacherslounge`
7. Click "Create"
8. Copy the generated Client ID

In the SignInView.js file, replace:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```
with your actual Google Client ID.

## LinkedIn Sign-In Setup

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in the required information about your app
4. In the "Products" section, add "Sign In with LinkedIn" product
5. In the "Auth" section, add your app's Expo redirect URI:
   - Format: `https://auth.expo.io/@your-expo-username/teacherslounge`
6. Under "OAuth 2.0 settings", note your Client ID and Client Secret

In the SignInView.js file, replace:
```javascript
const LINKEDIN_CLIENT_ID = 'YOUR_LINKEDIN_CLIENT_ID';
```
with your actual LinkedIn Client ID.

In the backend, you'll need to configure the Client Secret for LinkedIn authentication.

## Apple Sign-In Setup

Apple Sign-In requires an Apple Developer account and is only required for iOS apps distributed in the App Store.

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to "Certificates, IDs & Profiles"
3. Register a new App ID if you don't have one already
4. Enable "Sign In with Apple" capability for your App ID
5. Create a "Services ID" for your website
6. Configure the "Sign In with Apple" for your Services ID
7. Add your app's domain to the "Domains and Subdomains" field
8. Add your app's redirect URI to the "Return URLs" field

For Expo apps, Apple Sign-In works automatically with the `expo-apple-authentication` package.

## Backend Setup

For the social logins to work properly, you need to configure your backend to handle authentication with these providers:

1. Create API endpoints for social authentication:
   - `/api/auth/social` (for Google and Apple)
   - `/api/auth/linkedin` (for LinkedIn, which requires server-side code exchange)

2. Implement token verification with each provider

3. Create or retrieve user accounts based on the social profile information

4. Generate and return JWT tokens for authenticated users

## Testing

Before deploying to production, test each social login flow using Expo's development environment.

## Security Considerations

- Never commit your client secrets to version control
- Use environment variables or secure storage for sensitive credentials
- Implement proper token validation on your backend
- Follow each provider's guidelines for secure implementation 