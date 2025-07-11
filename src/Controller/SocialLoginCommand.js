import { apiUrl } from '@env';
import * as SecureStore from 'expo-secure-store';
import User from '../Model/User';
import { Alert } from 'react-native';

// Handles Google login authentication
export const handleGoogleLogin = async (navigation, authorizationCode, redirectUri, codeVerifier, clientId) => {
  try {
    console.log('=== GOOGLE LOGIN DEBUG ===');
    console.log('Processing Google authorization code:', authorizationCode);
    console.log('Using redirect URI:', redirectUri);
    console.log('Code verifier present:', !!codeVerifier);
    console.log('Client ID:', clientId);
    console.log('API URL:', apiUrl);
    
    const requestUrl = `${apiUrl}/api/auth/google`;
    console.log('Making request to:', requestUrl);
    
    // Prepare request body
    const requestBody = { 
      code: authorizationCode,
      redirect_uri: redirectUri,
      client_id: clientId
    };
    
    // Add code_verifier if available (for PKCE)
    if (codeVerifier) {
      requestBody.code_verifier = codeVerifier;
    }
    
    // Send the authorization code and redirect URI to the backend for processing
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Backend response:', data);
    console.log('=== END GOOGLE LOGIN DEBUG ===');

    if (response.status === 200) {
      await handleSocialLoginSuccess(navigation, data);
      return true;
    } else {
      console.error('Login failed with status:', response.status);
      Alert.alert('Login Error', data.message || 'Failed to login with Google');
      return false;
    }
  } catch (error) {
    console.error('=== GOOGLE LOGIN ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    Alert.alert('Error', 'Failed to login with Google: ' + error.message);
    return false;
  }
};

// Handles LinkedIn login authentication
export const handleLinkedInLogin = async (navigation, code) => {
  try {
    // Exchange the authorization code for an access token with your backend
    const response = await fetch(`${apiUrl}/api/auth/linkedin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    if (response.status === 200) {
      await handleSocialLoginSuccess(navigation, data);
      return true;
    } else {
      Alert.alert('Login Error', data.message || 'Failed to login with LinkedIn');
      return false;
    }
  } catch (error) {
    console.error('LinkedIn login error:', error);
    Alert.alert('Error', 'Failed to login with LinkedIn');
    return false;
  }
};

// Handles Apple login authentication
export const handleAppleLogin = async (navigation, credential) => {
  try {
    // Call your backend API to authenticate with Apple credentials
    const response = await fetch(`${apiUrl}/api/auth/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'apple',
        email: credential.email,
        firstName: credential.fullName?.givenName,
        lastName: credential.fullName?.familyName,
        providerId: credential.user,
        identityToken: credential.identityToken,
      }),
    });

    const data = await response.json();
    if (response.status === 200) {
      await handleSocialLoginSuccess(navigation, data);
      return true;
    } else {
      Alert.alert('Login Error', data.message || 'Failed to login with Apple');
      return false;
    }
  } catch (error) {
    console.error('Apple login error:', error);
    Alert.alert('Error', 'Failed to login with Apple');
    return false;
  }
};

// Process successful social login
const handleSocialLoginSuccess = async (navigation, data) => {
  if (data.user != null) {
    // 兼容新旧版本：优先使用SchoolName，如果不存在则使用SchoolID，都没有则使用空字符串
    const schoolInfo = data.user.SchoolName || data.user.SchoolID || "";
    
    let user = new User(
      data.user.Email,
      data.user.FirstName,
      data.user.LastName,
      schoolInfo,
      data.user.Role,
      data.user.ProfilePicLink
    );

    try {
      // Store token
      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("username", data.user.Email);

      if (user.userRole == "Approved" || user.userRole == "Admin") {
        // Check if this is the admin account which should bypass 2FA
        if (data.user.Email.toLowerCase() === "admin@admin.com") {
          // Admin account bypasses 2FA and goes directly to main app
          navigation.navigate("User", { User: user });
        } else {
        // Check if 2FA is enabled for this user
        if (data.requires2FA) {
          navigation.navigate("TwoFactorAuth", { User: user, email: data.user.Email });
        } else {
          navigation.navigate("User", { User: user });
          }
        }
      } else {
        Alert.alert("Account Status", "Your account is still awaiting approval");
      }
    } catch (error) {
      console.error('Social login processing error:', error);
      Alert.alert("Error", "Failed to process login");
    }
  } else {
    Alert.alert("Error", "Failed to retrieve user information");
  }
}; 