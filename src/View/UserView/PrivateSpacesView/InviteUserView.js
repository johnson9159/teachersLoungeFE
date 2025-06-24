import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PrivateSpaceManager from "../../../Controller/PrivateSpaceManager";
import * as SecureStore from 'expo-secure-store';

const InviteUserView = ({ route }) => {
  const navigation = useNavigation();
  const { spaceId } = route.params;
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviting, setInviting] = useState({});

  const privateSpaceManager = new PrivateSpaceManager();

  const fetchInvitableUsers = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      let fetchedUsers;
      
      if (searchQuery.trim()) {
        fetchedUsers = await privateSpaceManager.searchInvitableUsers(
          "http://192.168.1.154:4001", // Use your API URL
          token,
          spaceId,
          searchQuery.trim()
        );
      } else {
        fetchedUsers = await privateSpaceManager.getInvitableUsers(
          "http://192.168.1.154:4001", // Use your API URL
          token,
          spaceId
        );
      }
      
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitableUsers();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchInvitableUsers();
      } else if (searchQuery.trim().length === 0) {
        fetchInvitableUsers();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery("");
    await fetchInvitableUsers();
    setRefreshing(false);
  };

  const handleInviteUser = async (userEmail) => {
    try {
      setInviting({ ...inviting, [userEmail]: true });
      const token = await SecureStore.getItemAsync("token");
      await privateSpaceManager.inviteUser(
        "http://192.168.1.154:4001", // Use your API URL
        token,
        spaceId,
        userEmail
      );
      Alert.alert("Success", "Invitation sent successfully");
      fetchInvitableUsers(); // Refresh the list
    } catch (error) {
      console.error("Error inviting user:", error);
      Alert.alert("Error", error.message || "Failed to send invitation");
    } finally {
      setInviting({ ...inviting, [userEmail]: false });
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.schoolname && (
            <Text style={styles.userSchool}>{item.schoolname}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.inviteButton,
          inviting[item.email] && styles.disabledButton,
        ]}
        onPress={() => handleInviteUser(item.email)}
        disabled={inviting[item.email]}
      >
        {inviting[item.email] ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="send" size={16} color="white" />
            <Text style={styles.inviteButtonText}>Invite</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6382E8" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.email}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery.trim() 
                  ? "No users found matching your search" 
                  : "No users available to invite"
                }
              </Text>
              {searchQuery.trim() && (
                <Text style={styles.emptySubtext}>
                  Try searching with different keywords
                </Text>
              )}
            </View>
          }
          ListHeaderComponent={
            users.length > 0 && (
              <Text style={styles.resultCount}>
                {users.length} user{users.length !== 1 ? 's' : ''} available to invite
              </Text>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e7ecfe",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  userCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e7ecfe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#6382E8",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userSchool: {
    fontSize: 12,
    color: "#999",
  },
  inviteButton: {
    backgroundColor: "#6382E8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  inviteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});

export default InviteUserView; 