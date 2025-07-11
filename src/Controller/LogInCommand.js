import { Alert } from "react-native";
import User from "../Model/User";
import * as SecureStore from 'expo-secure-store';
import { apiUrl, loginRoute } from "@env";

//Logs user into the app based on their email and password
async function login({ navigation }, email, password) {
  if (email != "" && password != "") {
    //URL for server
    let urlLogin = apiUrl + loginRoute;
    console.log(urlLogin)
    const reqOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: email, password: password }),
    };
    
    try {
      const response = await fetch(urlLogin, reqOptions);
      const data = await response.json();
      
      console.log("Login response:", data); // 添加调试日志

      if (response.status != 200) {
        Alert.alert("Login Error: ", data.message);
      } else { // Successful login
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
            // Store token in secure store
            await SecureStore.setItemAsync("token", data.token);

            // Store username in secure store
            await SecureStore.setItemAsync("username", email);

            if (user.userRole == "Approved" || user.userRole == "Admin") {
              // Check if this is the admin account which should bypass 2FA
              console.log("Checking admin bypass for email:", email.toLowerCase());
              console.log("User role:", user.userRole);
              if (email.toLowerCase() === "admin@admin.com") {
                console.log("Admin account detected - bypassing 2FA");
                // Admin account bypasses 2FA and goes directly to main app
                navigation.navigate("User", { User: user });
              } else {
                console.log("Regular user - requiring 2FA");
                // 2FA is mandatory for all other users
                navigation.navigate("TwoFactorAuth", { User: user, email: email });
              }
            } else {
              //Only approved users can login
              Alert.alert("Still awaiting approval to join the app");
            }
          } catch (error) {
            console.error("SecureStore error:", error);
            Alert.alert("Couldn't login, please try again");
          }

        } else {
          Alert.alert("Login Error: ", data.message);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert("Network Error", "Unable to connect to server. Please check your internet connection.");
    }
  } else {
    Alert.alert("Error: ", "Email and password must not be blank");
  }
}

export { login };
