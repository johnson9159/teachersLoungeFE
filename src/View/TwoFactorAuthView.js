import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import App_StyleSheet from '../Styles/App_StyleSheet';
import { apiUrl } from '@env';
import * as SecureStore from 'expo-secure-store';

function TwoFactorAuthView({ navigation, route }) {
  const { User, email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Send OTP when component mounts
    sendOTP();
    
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sendOTP = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (await SecureStore.getItemAsync("token")),
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.status === 200) {
        Alert.alert('Success', 'Verification code sent to your email');
      } else {
        Alert.alert('Error', data.message || 'Failed to send verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(60);
    await sendOTP();
    
    // Restart timer
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (await SecureStore.getItemAsync("token")),
        },
        body: JSON.stringify({ 
          email,
          otp: otpCode || otp.join('') 
        }),
      });

      const data = await response.json();
      if (response.status === 200) {
        // Update token with 2FA verified token
        if (data.token) {
          await SecureStore.setItemAsync("token", data.token);
        }
        
        Alert.alert('Success', 'Verification successful!');
        navigation.navigate("User", { User });
      } else {
        Alert.alert('Error', data.message || 'Invalid verification code');
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify code');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={App_StyleSheet.register_signIn_background}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={App_StyleSheet.block}>
        <Text style={App_StyleSheet.twoFactorTitle}>Two-Factor Authentication</Text>
        <Text style={App_StyleSheet.twoFactorSubtitle}>
          Enter the 6-digit code sent to your email
        </Text>
        
        <View style={App_StyleSheet.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={App_StyleSheet.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity
          style={App_StyleSheet.default_button}
          onPress={() => verifyOTP()}
        >
          <Text style={App_StyleSheet.text}>Verify</Text>
        </TouchableOpacity>

        <View style={App_StyleSheet.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={App_StyleSheet.resendText}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={App_StyleSheet.resendTimerText}>
              Resend code in {resendTimer}s
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={App_StyleSheet.default_button}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={App_StyleSheet.text}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default TwoFactorAuthView; 