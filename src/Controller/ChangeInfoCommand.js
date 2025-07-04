import React from "react";
import ProfileNavigator from "../View/UserView/ProfileView/ProfileNavigator";
import { useRoute } from "@react-navigation/native";
import { apiUrl } from "@env";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

class ChangeInfoCommand {
  user;
  constructor(user) {
    this.user = user;
  }

  async ChangeInfo({ navigation }, content) {
    if (!content || content.trim() === "") {
      Alert.alert("Error", "Field cannot be empty");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      let updateData = {
        email: this.user.userUserName
      };

      // Determine what field to update based on the last clicked item
    if (ProfileNavigator.lastClick == "Edit Name") {
        // Split the name into first and last name
        const nameParts = content.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        updateData.firstname = firstName;
        updateData.lastname = lastName;
        
        // Update local user object
      this.user.changeUserName(content);
    } else if (ProfileNavigator.lastClick == "Edit Username") {
        updateData.newEmail = content.trim();
        
        // Update local user object
      this.user.userUserName = content;
    } else if (ProfileNavigator.lastClick == "Edit School") {
        updateData.schoolName = content.trim();
        
        // Update local user object
      this.user.school = content;
    }

      // Make API call to update user info
      const response = await fetch(`${apiUrl}/updateUserInfo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Information updated successfully");
        
        // If email was changed, update the stored token with new email
        if (ProfileNavigator.lastClick == "Edit Username") {
          await SecureStore.setItemAsync("username", content.trim());
        }
        
    navigation.navigate("Profile");
    navigation.navigate("Edit Profile");
      } else {
        Alert.alert("Error", result.message || "Failed to update information");
        console.error("Update failed:", result);
      }
    } catch (error) {
      console.error("Error updating user info:", error);
      Alert.alert("Error", "Network error. Please try again.");
    }
  }
}

export default ChangeInfoCommand;
