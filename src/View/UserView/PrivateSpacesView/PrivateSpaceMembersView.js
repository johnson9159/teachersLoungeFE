import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PrivateSpaceManager from "../../../Controller/PrivateSpaceManager";
import * as SecureStore from 'expo-secure-store';

const PrivateSpaceMembersView = ({ route }) => {
  const navigation = useNavigation();
  const { baseURL, spaceId, userRole } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState({});

  const privateSpaceManager = new PrivateSpaceManager();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      const membersList = await privateSpaceManager.getMembers(
        baseURL,
        token,
        spaceId
      );
      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const handleRemoveMember = async (memberEmail, memberName) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName} from this space?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setRemoving({ ...removing, [memberEmail]: true });
              const token = await SecureStore.getItemAsync("token");
              await privateSpaceManager.removeMember(
                baseURL,
                token,
                spaceId,
                memberEmail
              );
              Alert.alert("Success", "Member removed successfully");
              fetchMembers(); // Refresh the list
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", error.message || "Failed to remove member");
            } finally {
              setRemoving({ ...removing, [memberEmail]: false });
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <Text style={styles.joinDate}>
            Joined {new Date(item.joined_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.memberActions}>
        {item.role === "admin" && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
        {userRole === "admin" && item.role !== "admin" && (
          <TouchableOpacity
            onPress={() => handleRemoveMember(item.email, item.name)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={24} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6382E8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {members.length} {members.length === 1 ? "Member" : "Members"}
        </Text>
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.email}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />

      {userRole === "admin" && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => navigation.navigate("InviteUser", route.params)}
        >
          <Ionicons name="person-add" size={20} color="white" />
          <Text style={styles.inviteButtonText}>Invite Member</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  memberCard: {
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
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
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
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    color: "#999",
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminBadge: {
    backgroundColor: "#6382E8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  adminText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  inviteButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#6382E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  inviteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default PrivateSpaceMembersView; 