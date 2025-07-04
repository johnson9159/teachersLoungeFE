import { React, useEffect, useRef, useState } from "react";
import { Text, View, TouchableOpacity, Animated, Image, KeyboardAvoidingView, Platform, Linking, Alert, Modal } from "react-native";
import { TextInput } from "react-native-paper";
//import LogInCommand from "../Controller/LogInCommand";
import { login } from "../Controller/LogInCommand";
import App_StyleSheet from "../Styles/App_StyleSheet";
import { FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { handleGoogleLogin, handleLinkedInLogin, handleAppleLogin } from '../Controller/SocialLoginCommand';
import { WebView } from 'react-native-webview';

WebBrowser.maybeCompleteAuthSession();

let email = "";
let password = "";
let logo = require("../../assets/logo.png");

// Google OAuth configuration - Platform-specific Client IDs
const GOOGLE_ANDROID_CLIENT_ID = '503056180344-vfqo4hkmm4qoe1e2a5b3t4itpqs8sbcf.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '503056180344-b2mc69o5h958afpkoclbjl6pk3lcc6dl.apps.googleusercontent.com';

// Use platform-specific URL schemes for Google OAuth
const getGoogleRedirectUri = () => {
  if (Platform.OS === 'ios') {
    return 'com.googleusercontent.apps.503056180344-b2mc69o5h958afpkoclbjl6pk3lcc6dl://';
  } else {
    return 'com.googleusercontent.apps.503056180344-vfqo4hkmm4qoe1e2a5b3t4itpqs8sbcf://';
  }
};

const GOOGLE_REDIRECT_URI = getGoogleRedirectUri();

// Display redirect URI information
console.log('=== Google OAuth Configuration Information ===');
console.log('Google Android Client ID:', GOOGLE_ANDROID_CLIENT_ID);
console.log('Google iOS Client ID:', GOOGLE_IOS_CLIENT_ID);
console.log('Google Redirect URI:', GOOGLE_REDIRECT_URI);
console.log('Using custom scheme for production builds');
console.log('============================');

// LinkedIn OAuth configuration
const LINKEDIN_CLIENT_ID = '77bw10d90022pu';
const LINKEDIN_REDIRECT_URI = 'https://omegaeducationaltechsolutions.com/linkedin-redirect';

function SignInView({ navigation }) {
  // State for LinkedIn WebView modal
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [linkedInAuthUrl, setLinkedInAuthUrl] = useState('');

  // Google Auth Request
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: Platform.OS === 'android' ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_IOS_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: GOOGLE_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      additionalParameters: {
        prompt: 'select_account',
      },
    },
    { 
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  // LinkedIn Auth Request - Updated for OpenID Connect
  const [linkedInRequest, linkedInResponse, linkedInPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: LINKEDIN_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'], // Updated to include 'openid' for OpenID Connect
      redirectUri: LINKEDIN_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
      additionalParameters: {
        response_type: 'code',
        state: Math.random().toString(36).substring(7), 
      },
    },
    { authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization' }
  );

  // Handle Google auth response
  useEffect(() => {
    console.log('=== GOOGLE RESPONSE DEBUG ===');
    console.log('Google response:', googleResponse);
    console.log('Response type:', googleResponse?.type);
    console.log('Response params:', googleResponse?.params);
    console.log('============================');
    
    if (googleResponse?.type === 'success') {
      const { code } = googleResponse.params;
      console.log('Google auth success! Code:', code);
      
      // Get the code verifier for PKCE if available
      const codeVerifier = googleRequest?.codeVerifier;
      console.log('Code verifier from request:', !!codeVerifier);
      
      const clientId = Platform.OS === 'android' ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_IOS_CLIENT_ID;
      handleGoogleLogin(navigation, code, GOOGLE_REDIRECT_URI, codeVerifier, clientId);
    } else if (googleResponse?.type === 'error') {
      console.error('Google auth error:', googleResponse.error);
    } else if (googleResponse?.type === 'cancel') {
      console.log('Google auth cancelled by user');
    }
  }, [googleResponse]);

  // Handle LinkedIn login using custom WebView modal
  const handleLinkedInWebViewAuth = async () => {
    try {
      console.log('Starting LinkedIn OAuth with custom WebView...');
      
      // Generate state parameter for security
      const state = Math.random().toString(36).substring(7);
      
      // Build LinkedIn authorization URL with OpenID Connect scope
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=openid%20profile%20email&state=${state}`;
      
      console.log('LinkedIn auth URL:', authUrl);

      // Set the auth URL and show the modal
      setLinkedInAuthUrl(authUrl);
      setShowLinkedInModal(true);
      
    } catch (error) {
      console.error('LinkedIn auth error:', error);
      Alert.alert('LinkedIn Login Error', `Error: ${error.message}`);
    }
  };

  // Handle WebView navigation state changes
  const handleWebViewNavigationStateChange = (navState) => {
    console.log('WebView navigation state change:', navState.url);
      
    // Check if the URL contains our redirect URI
    if (navState.url && navState.url.includes('omegaeducationaltechsolutions.com/linkedin-redirect')) {
      console.log('LinkedIn redirect detected:', navState.url);
      
      try {
        // Parse the URL to extract authorization code
        const url = new URL(navState.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        // Close the modal first
        setShowLinkedInModal(false);
        
        if (error) {
          console.error('LinkedIn OAuth error:', error);
          Alert.alert('LinkedIn Login Error', `Authorization failed: ${error}`);
          return;
        }
        
        if (!code) {
          console.error('No authorization code received from LinkedIn');
          Alert.alert('LinkedIn Login Error', 'No authorization code received');
          return;
        }
        
        console.log('LinkedIn authorization code received:', code);
        
        // Send code to backend for processing
          handleLinkedInLogin(navigation, code);
        
      } catch (error) {
        console.error('Error parsing LinkedIn redirect URL:', error);
        Alert.alert('LinkedIn Login Error', 'Failed to process authorization response');
      }
    }
  };

  // Handle WebView load error
  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView load error:', nativeEvent);
    setShowLinkedInModal(false);
    Alert.alert('LinkedIn Login Error', 'Failed to load LinkedIn login page');
  };

  return (
    <View style={App_StyleSheet.register_signIn_background}>
      <View style={App_StyleSheet.block}>
        <Image style={App_StyleSheet.logoStyle} source={logo} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={60}
        >
          <TextInput
            style={App_StyleSheet.textBlock}
            placeholder="Email"
            underlineColor={"transparent"}
            selectionColor={"black"}
            activeUnderlineColor={"transparent"}
            multiline={false}
            returnKeyType="done"
            onChangeText={(value) => (email = value)}
            autoCapitalize="none"
          />
          <TextInput
            secureTextEntry={true}
            style={App_StyleSheet.textBlock}
            placeholder="Password"
            underlineColor={"transparent"}
            selectionColor={"black"}
            activeUnderlineColor={"transparent"}
            multiline={false}
            returnKeyType="done"
            onChangeText={(value) => (password = value)}
          />
        </KeyboardAvoidingView>
        

        
        <TouchableOpacity
          style={App_StyleSheet.default_button}
          onPress={
            async () => {
              let user = await login({ navigation }, email, password);
            }
          }
        >
          <Text style={App_StyleSheet.text}>{"Sign In"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={App_StyleSheet.default_button}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={App_StyleSheet.text}>{"Sign Up"}</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={App_StyleSheet.divider}>
          <View style={App_StyleSheet.dividerLine} />
          <Text style={App_StyleSheet.dividerText}>OR</Text>
          <View style={App_StyleSheet.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <TouchableOpacity
          style={[App_StyleSheet.socialLoginButton, { backgroundColor: '#DB4437' }]}
          onPress={() => googlePromptAsync()}
          disabled={!googleRequest}
        >
          <FontAwesome name="google" size={20} color="white" />
          <Text style={App_StyleSheet.socialButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[App_StyleSheet.socialLoginButton, { backgroundColor: '#0077B5' }]}
          onPress={handleLinkedInWebViewAuth}
        >
          <FontAwesome name="linkedin" size={20} color="white" />
          <Text style={App_StyleSheet.socialButtonText}>Sign in with LinkedIn</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={20}
            style={App_StyleSheet.appleButton}
            onPress={async () => {
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                });
                handleAppleLogin(navigation, credential);
              } catch (e) {
                if (e.code === 'ERR_REQUEST_CANCELED') {
                  // User canceled Apple sign in
                } else {
                  console.error('Apple sign in error', e);
                }
              }
            }}
          />
        )}
      </View>

      {showLinkedInModal && (
        <Modal
          visible={showLinkedInModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLinkedInModal(false)}
        >
          <View style={App_StyleSheet.modalBackground}>
            <View style={App_StyleSheet.modalContent}>
              {/* Close button */}
              <TouchableOpacity
                style={App_StyleSheet.modalCloseButton}
                onPress={() => setShowLinkedInModal(false)}
              >
                <Text style={App_StyleSheet.modalCloseText}>×</Text>
              </TouchableOpacity>
              
              {/* WebView for LinkedIn OAuth */}
              <WebView
                source={{ uri: linkedInAuthUrl }}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                onError={handleWebViewError}
                style={{ flex: 1 }}
                startInLoadingState={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
export default SignInView;
