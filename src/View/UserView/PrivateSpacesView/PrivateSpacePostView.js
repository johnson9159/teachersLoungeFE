import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PrivateSpaceManager from "../../../Controller/PrivateSpaceManager";
import * as SecureStore from 'expo-secure-store';

const PrivateSpacePostView = ({ route }) => {
  const navigation = useNavigation();
  const { baseURL, post } = route.params;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const privateSpaceManager = new PrivateSpaceManager();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      console.log("Fetching comments for post ID:", post.post_id || post.postId);
      const postId = post.post_id || post.postId;
      const fetchedComments = await privateSpaceManager.getComments(
        baseURL,
        token,
        postId
      );
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setSubmitting(true);
      const token = await SecureStore.getItemAsync("token");
      const postId = post.post_id || post.postId;
      console.log("Adding comment to post ID:", postId);
      await privateSpaceManager.addComment(
        baseURL,
        token,
        postId,
        newComment.trim()
      );
      setNewComment("");
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            {post.author_avatar ? (
              <Image
                source={{ uri: post.author_avatar }}
                style={styles.authorAvatar}
              />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Ionicons name="person" size={24} color="#666" />
              </View>
            )}
            <View style={styles.postInfo}>
              <Text style={styles.authorName}>{post.author_name}</Text>
              <Text style={styles.postTime}>
                {new Date(post.created_at).toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>

          {post.file_url && (
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL(post.file_url)}
            >
              Open Image File
            </Text>
          )}

          <View style={styles.postStats}>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.statText}>{post.comment_count} comments</Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsSectionTitle}>Comments</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#6382E8" style={styles.loader} />
          ) : comments.length > 0 ? (
            comments.map((comment, index) => (
              <View key={index} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAvatar}>
                    <Ionicons name="person" size={16} color="#6382E8" />
                  </View>
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentAuthor}>{comment.author_name || 'Anonymous'}</Text>
                    <Text style={styles.commentTime}>
                      {new Date(comment.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newComment.trim() || submitting) && styles.disabledButton,
          ]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || submitting}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  authorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  postTime: {
    fontSize: 14,
    color: "#999",
  },
  postContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 16,
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: "cover",
  },
  postStats: {
    flexDirection: "row",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  commentsSection: {
    backgroundColor: "white",
    marginTop: 8,
    padding: 16,
    minHeight: 200,
  },
  commentsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  noCommentsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
  loader: {
    marginTop: 20,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e7ecfe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginLeft: 40,
  },
  commentInputContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6382E8",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  linkText: {
    color: "#6382E8",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 16,
  },
});

export default PrivateSpacePostView; 