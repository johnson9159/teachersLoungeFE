import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  View,
} from "react-native";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { SelectList } from "react-native-dropdown-select-list";
import PostComponentView from "./PostComponentView";
import SafeArea from "../../SafeArea";
import {
  getApprovedPosts
} from "../../../Controller/PostManager.js";
import Post from "../../../Model/Posts/Post.js";
import App_StyleSheet from "../../../Styles/App_StyleSheet";
import { Ionicons } from '@expo/vector-icons';

function PostListingsView({ navigation }) {
  const route = useRoute();
  const isFocused = useIsFocused();

  React.useEffect(() => {
    if (isFocused) {
      loadPosts();
    }
  }, [isFocused]);

  const [posts, setPosts] = useState([]);
  const loadPosts = async () => {
    const data = await getApprovedPosts(route.params.User.userUserName);
    const sortedPosts = data.sort((a, b) => b.id - a.id); // change later to not sort by id
    setPosts(sortedPosts);
  };

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={App_StyleSheet.content}>
          {posts && (
            <FlatList
              ListEmptyComponent={
                <Text style={App_StyleSheet.list_message}>
                  {"No posts yet!"}
                </Text>
              }
              ListFooterComponent={
                posts[0] && (
                  <Text style={App_StyleSheet.list_message}>
                    {"You've viewed all posts!"}
                  </Text>
                )
              }
              data={posts}
              extraData={posts}
              renderItem={({ item }) => (
                <PostComponentView
                  navigation={navigation}
                  post={item}
                />
              )}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
            />
          )}
        </View>
        
        {/* Floating Action Button for creating posts */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Create Post')}
        >
          <Ionicons name="create" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6382E8', // Using the same blue color as the app theme
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default PostListingsView;
