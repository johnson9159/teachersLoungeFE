import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PrivateSpaceManager from "../../../Controller/PrivateSpaceManager";
import { apiUrl } from "@env";
import * as SecureStore from 'expo-secure-store';

const PrivateSpaceView = ({ route }) => {
  const navigation = useNavigation();
  const { spaceId, spaceName } = route.params;
  const [spaceDetails, setSpaceDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const privateSpaceManager = new PrivateSpaceManager();

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      const [details, postsData] = await Promise.all([
        privateSpaceManager.getPrivateSpaceDetails(apiUrl, token, spaceId),
        privateSpaceManager.getPosts(apiUrl, token, spaceId, 1, 20),
      ]);
      
      setSpaceDetails(details.space);
      setUserRole(details.userRole);
      
      // 正确处理 posts 数据格式
      let postsList = [];
      if (postsData && postsData.posts && Array.isArray(postsData.posts)) {
        postsList = postsData.posts;
      } else if (Array.isArray(postsData)) {
        postsList = postsData;
      }
      
      setPosts(postsList);
      setPage(1);
      setHasMore(postsList.length > 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      setPosts([]);
      Alert.alert("Error", "Failed to load space data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      const data = await privateSpaceManager.getPosts(apiUrl, token, spaceId, pageNum, 20);
      
      // 确保 data 和 data.posts 存在且为数组
      let postsList = [];
      if (data && data.posts && Array.isArray(data.posts)) {
        postsList = data.posts;
      } else if (Array.isArray(data)) {
        postsList = data;
      }
      
      if (pageNum === 1) {
        setPosts(postsList);
      } else {
        setPosts(prev => {
          // 确保 prev 是数组
          const prevArray = Array.isArray(prev) ? prev : [];
          return [...prevArray, ...postsList];
        });
      }
      
      setPage(pageNum);
      setHasMore(postsList.length > 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // 使用useFocusEffect来在页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [spaceId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1);
    }
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("token");
              await privateSpaceManager.deletePost(apiUrl, token, postId);
              Alert.alert("Success", "Post deleted successfully");
              fetchData(); // Refresh the list
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  const handleDissolveSpace = async () => {
    Alert.alert(
      "Dissolve Private Space",
      "Are you sure you want to dissolve this private space? This action cannot be undone and will delete all posts, comments, and remove all members.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dissolve",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("token");
              await privateSpaceManager.dissolveSpace(apiUrl, token, spaceId);
              Alert.alert("Success", "Private space dissolved successfully", [
                {
                  text: "OK",
                  onPress: () => {
                    // Navigate back to the private spaces list
                    navigation.navigate("PrivateSpacesList");
                  },
                },
              ]);
            } catch (error) {
              console.error("Error dissolving private space:", error);
              Alert.alert("Error", "Failed to dissolve private space");
            }
          },
        },
      ]
    );
  };

  const renderPost = ({ item }) => {
    const currentUserEmail = spaceDetails?.current_user_email;
    
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() =>
          navigation.navigate("PrivateSpacePost", {
            baseURL: apiUrl,
            post: item,
          })
        }
      >
        <View style={styles.postHeader}>
          {item.author_avatar ? (
            <Image source={{ uri: item.author_avatar }} style={styles.authorAvatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Ionicons name="person" size={20} color="#6382E8" />
            </View>
          )}
          <View style={styles.postInfo}>
            <Text style={styles.authorName}>{item.author_name || 'Anonymous'}</Text>
            <Text style={styles.postTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          {(userRole === "admin" || item.author_email === currentUserEmail) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePost(item.post_id)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.postContent} numberOfLines={3}>
          {item.content}
        </Text>
        {item.file_url && (
          <Text
            style={styles.linkText}
            onPress={() => Linking.openURL(item.file_url)}
          >
            Open Image File
          </Text>
        )}
        <View style={styles.postFooter}>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.comment_count || 0} comments</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6382E8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {spaceDetails && (
        <View style={styles.header}>
          <Text style={styles.spaceName}>{spaceDetails.name}</Text>
          <Text style={styles.spaceDescription}>{spaceDetails.description}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("PrivateSpaceMembers", {
                  baseURL: apiUrl,
                  spaceId: spaceId,
                  userRole: userRole,
                })
              }
            >
              <Ionicons name="people" size={20} color="#6382E8" />
              <Text style={styles.actionText}>
                {spaceDetails.member_count} Members
              </Text>
            </TouchableOpacity>
            {userRole === "admin" && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    navigation.navigate("InviteUser", {
                      spaceId: spaceId,
                    })
                  }
                >
                  <Ionicons name="person-add" size={20} color="#6382E8" />
                  <Text style={styles.actionText}>Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.dissolveButton]}
                  onPress={handleDissolveSpace}
                >
                  <Ionicons name="trash" size={20} color="#ff4444" />
                  <Text style={[styles.actionText, styles.dissolveText]}>Dissolve</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.post_id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share something
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate("CreatePrivateSpacePost", {
            baseURL: apiUrl,
            spaceId: spaceId,
          })
        }
      >
        <Ionicons name="create" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e7ecfe",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e7ecfe",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  spaceName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  spaceDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e7ecfe",
    borderWidth: 1,
    borderColor: "#6382E8",
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6382E8",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 80,
  },
  postCard: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e7ecfe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#6382E8",
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: "#6382E8",
    fontWeight: "bold",
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6382E8",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dissolveButton: {
    backgroundColor: "#ff4444",
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  dissolveText: {
    color: "white",
  },
});

export default PrivateSpaceView; 