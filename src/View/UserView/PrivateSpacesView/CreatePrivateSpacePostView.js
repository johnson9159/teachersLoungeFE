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
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PrivateSpaceManager from "../../../Controller/PrivateSpaceManager";
import * as SecureStore from 'expo-secure-store';
import { selectPic } from "../../../Controller/DocumentPicker";

const CreatePrivateSpacePostView = ({ route }) => {
  const navigation = useNavigation();
  const { baseURL, spaceId } = route.params;
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const privateSpaceManager = new PrivateSpaceManager();

  const handleSelectImage = async () => {
    try {
      setUploadingImage(true);
      const file = await selectPic(false);
      console.log("Selected file:", file);
      if (file && file.url && file.url !== "") {
        setSelectedImage(file);
        console.log("Image selected successfully:", file.url);
      } else {
        console.log("No image selected or user cancelled");
        // Don't show error if user just cancelled
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please enter some content for your post");
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      const fileUrl = selectedImage ? selectedImage.url : null;
      await privateSpaceManager.createPost(baseURL, token, spaceId, content.trim(), fileUrl);
      
      Alert.alert("Success", "Post created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Post</Text>
          <Text style={styles.subtitle}>Share your thoughts with the space</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>What's on your mind?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts with the space..."
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {content.length}/1000
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.addPhotoButton}
            onPress={handleSelectImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#6382E8" />
            ) : (
              <Ionicons name="camera" size={20} color="#6382E8" />
            )}
            <Text style={styles.addPhotoText}>
              {uploadingImage ? "Uploading..." : selectedImage ? "Change Photo" : "Add Photo"}
            </Text>
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage.url }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={handleCreatePost}
          disabled={loading || !content.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.postButtonText}>Post to Space</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e7ecfe",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#6382E8",
    borderStyle: "dashed",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addPhotoText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#6382E8",
    fontWeight: "600",
  },
  imagePreviewContainer: {
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    position: "relative",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postButton: {
    backgroundColor: "#6382E8",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  postButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  postButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default CreatePrivateSpacePostView; 