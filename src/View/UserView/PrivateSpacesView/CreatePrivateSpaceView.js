import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PrivateSpaceManager from "../../../Controller/PrivateSpaceManager";
import { apiUrl } from "@env";
import * as SecureStore from 'expo-secure-store';

const CreatePrivateSpaceView = ({ route }) => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const privateSpaceManager = new PrivateSpaceManager();

  const handleCreateSpace = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a space name");
      return;
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      
      await privateSpaceManager.createPrivateSpace(
        apiUrl,
        token,
        name.trim(),
        description.trim()
      );
      Alert.alert("Success", "Private space created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error creating private space:", error);
      Alert.alert("Error", error.message || "Failed to create private space");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={60} color="#6382E8" />
          <Text style={styles.headerText}>Create Private Space</Text>
          <Text style={styles.subheaderText}>
            Private spaces are invite-only communities where members can share
            content securely
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Space Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter space name"
              value={name}
              onChangeText={setName}
              maxLength={100}
              autoFocus
              editable={!loading}
            />
            <Text style={styles.charCount}>{name.length}/100</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your private space (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#6382E8" />
            <Text style={styles.infoText}>
              As the creator, you'll be the admin and can invite members to join
              this private space.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateSpace}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Space</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e7ecfe",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  subheaderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#e7ecfe",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  createButton: {
    backgroundColor: "#6382E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    elevation: 0,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default CreatePrivateSpaceView; 