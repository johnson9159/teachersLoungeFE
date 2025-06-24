import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PrivateSpaceManager from "../../../Controller/PrivateSpaceManager";
import { apiUrl } from "@env";
import App_StyleSheet from "../../../Styles/App_StyleSheet";
import * as SecureStore from 'expo-secure-store';

const PrivateSpacesListView = ({ route }) => {
  const navigation = useNavigation();
  const [privateSpaces, setPrivateSpaces] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const privateSpaceManager = new PrivateSpaceManager();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("=== DEBUG PRIVATE SPACES ===");
      console.log("route.params:", route.params);
      console.log("apiUrl:", apiUrl);
      
      const token = await SecureStore.getItemAsync("token");
      console.log("Token:", token ? "Found" : "Missing");
      console.log("Token value:", token);
      
      const [spaces, invitations] = await Promise.all([
        privateSpaceManager.getUserPrivateSpaces(apiUrl, token),
        privateSpaceManager.getPendingInvitations(apiUrl, token),
      ]);
      
      console.log("Fetched spaces:", spaces);
      console.log("Fetched invitations:", invitations);
      
      setPrivateSpaces(spaces);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error("Error fetching private spaces:", error);
      console.error("Error details:", error.message);
      Alert.alert("Error", `Failed to load private spaces: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      await privateSpaceManager.acceptInvitation(apiUrl, token, invitationId);
      Alert.alert("Success", "Invitation accepted successfully");
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to accept invitation");
    }
  };

  const renderInvitation = ({ item }) => (
    <View style={styles.invitationCard}>
      <Text style={styles.invitationTitle}>{item.space_name}</Text>
      <Text style={styles.invitationText}>Invited by: {item.inviter_name}</Text>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptInvitation(item.invitation_id)}
      >
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSpace = ({ item }) => (
    <TouchableOpacity
      style={styles.spaceCard}
      onPress={() =>
        navigation.navigate("PrivateSpace", {
          baseURL: apiUrl,
          spaceId: item.spaceId,
          spaceName: item.name,
        })
      }
    >
      <View style={styles.spaceHeader}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.spaceAvatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Ionicons name="lock-closed" size={24} color="#6382E8" />
          </View>
        )}
        <View style={styles.spaceInfo}>
          <Text style={styles.spaceName}>{item.name}</Text>
          <Text style={styles.spaceDescription} numberOfLines={2}>
            {item.description || "Private space"}
          </Text>
        </View>
      </View>
      <View style={styles.spaceStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color="#666" />
          <Text style={styles.statText}>{item.memberCount} members</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={16} color="#666" />
          <Text style={styles.statText}>{item.postCount} posts</Text>
        </View>
      </View>
      {item.userRole === "admin" && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminText}>Admin</Text>
        </View>
      )}
    </TouchableOpacity>
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
      {pendingInvitations.length > 0 && (
        <View style={styles.invitationsSection}>
          <Text style={styles.sectionTitle}>Pending Invitations</Text>
          <FlatList
            data={pendingInvitations}
            renderItem={renderInvitation}
            keyExtractor={(item) => item.invitation_id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <FlatList
        data={privateSpaces}
        renderItem={renderSpace}
        keyExtractor={(item) => item.spaceId.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="lock-closed-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No private spaces yet</Text>
            <Text style={styles.emptySubtext}>
              Create one or wait for an invitation
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate("CreatePrivateSpace", { baseURL: apiUrl })
        }
      >
        <Ionicons name="add" size={30} color="white" />
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
  invitationsSection: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  invitationCard: {
    backgroundColor: "#e7ecfe",
    padding: 16,
    borderRadius: 10,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: "#6382E8",
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  invitationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: "#6382E8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  spaceCard: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spaceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  spaceAvatar: {
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
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  spaceDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  spaceStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  adminBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#6382E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 80,
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
});

export default PrivateSpacesListView; 