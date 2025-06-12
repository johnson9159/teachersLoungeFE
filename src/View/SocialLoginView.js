import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import App_StyleSheet from '../Styles/App_StyleSheet';
import { apiUrl } from '@env';
import * as SecureStore from 'expo-secure-store';
import User from '../Model/User';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'teacherslounge'
});

// LinkedIn OAuth configuration
const LINKEDIN_CLIENT_ID = 'YOUR_LINKEDIN_CLIENT_ID';
const LINKEDIN_CLIENT_SECRET = 'YOUR_LINKEDIN_CLIENT_SECRET';
const LINKEDIN_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'teacherslounge'
});

function SocialLoginView({ navigation }) {
  // Google Auth
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: GOOGLE_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Token,
    },
    { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
  );

  // LinkedIn Auth
  const [linkedInRequest, linkedInResponse, linkedInPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: LINKEDIN_CLIENT_ID,
      scopes: ['profile', 'email'],
      redirectUri: LINKEDIN_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
      extraParams: {
        access_type: 'offline',
      },
    },
    {
      authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
    }
  );

  // Handle Google response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { access_token } = googleResponse.params;
      handleGoogleLogin(access_token);
    }
  }, [googleResponse]);

  // Handle LinkedIn response
  useEffect(() => {
    if (linkedInResponse?.type === 'success') {
      const { code } = linkedInResponse.params;
      handleLinkedInLogin(code);
    }
  }, [linkedInResponse]);

  // Google login handler
  const handleGoogleLogin = async (accessToken) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`
      );
      const userData = await userInfoResponse.json();

      // Send to backend for verification/registration
      const response = await fetch(`${apiUrl}/api/auth/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          email: userData.email,
          firstName: userData.given_name,
          lastName: userData.family_name,
          providerId: userData.id,
        }),
      });

      const data = await response.json();
      if (response.status === 200) {
        await handleSocialLoginSuccess(data);
      } else {
        Alert.alert('Login Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to login with Google');
    }
  };

  // LinkedIn login handler
  const handleLinkedInLogin = async (code) => {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${LINKEDIN_REDIRECT_URI}&client_id=${LINKEDIN_CLIENT_ID}&client_secret=${LINKEDIN_CLIENT_SECRET}`,
      });
      
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user profile
      const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const profileData = await profileResponse.json();

      // Get user email
      const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const emailData = await emailResponse.json();

      // Send to backend
      const response = await fetch(`${apiUrl}/api/auth/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'linkedin',
          email: emailData.elements[0]['handle~'].emailAddress,
          firstName: profileData.localizedFirstName,
          lastName: profileData.localizedLastName,
          providerId: profileData.id,
        }),
      });

      const data = await response.json();
      if (response.status === 200) {
        await handleSocialLoginSuccess(data);
      } else {
        Alert.alert('Login Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to login with LinkedIn');
    }
  };

  // Apple login handler
  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send to backend
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
        await handleSocialLoginSuccess(data);
      } else {
        Alert.alert('Login Error', data.message);
      }
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled
      } else {
        Alert.alert('Error', 'Failed to login with Apple');
      }
    }
  };

  const handleSocialLoginSuccess = async (data) => {
    if (data.user != null) {
      let user = new User(
        data.user.Email,
        data.user.FirstName,
        data.user.LastName,
        data.user.SchoolID,
        data.user.Role,
        data.user.ProfilePicLink
      );

      try {
        // Store token
        await SecureStore.setItemAsync("token", data.token);
        await SecureStore.setItemAsync("username", data.user.Email);

        if (user.userRole == "Approved" || user.userRole == "Admin") {
          // Check if 2FA is enabled for this user
          if (data.requires2FA) {
            navigation.navigate("TwoFactorAuth", { User: user, email: data.user.Email });
          } else {
            navigation.navigate("User", { User: user });
          }
        } else {
          Alert.alert("Still awaiting approval to join the app");
        }
      } catch (error) {
        Alert.alert("Couldn't login, please try again");
      }
    }
  };

  return (
    <View style={App_StyleSheet.socialLoginContainer}>
      <Text style={App_StyleSheet.socialLoginText}>Or sign in with</Text>
      
      <TouchableOpacity
        style={App_StyleSheet.socialLoginButton}
        onPress={() => googlePromptAsync()}
        disabled={!googleRequest}
      >
        <FontAwesome name="google" size={24} color="white" />
        <Text style={App_StyleSheet.socialButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={App_StyleSheet.socialLoginButton}
        onPress={() => linkedInPromptAsync()}
        disabled={!linkedInRequest}
      >
        <FontAwesome name="linkedin" size={24} color="white" />
        <Text style={App_StyleSheet.socialButtonText}>Sign in with LinkedIn</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={App_StyleSheet.appleButton}
          onPress={handleAppleLogin}
        />
      )}
    </View>
  );
}

export default SocialLoginView; 