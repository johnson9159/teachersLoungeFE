import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useRoute } from "@react-navigation/native";
import PrivateSpacesListView from "./PrivateSpacesListView";
import PrivateSpaceView from "./PrivateSpaceView";
import CreatePrivateSpaceView from "./CreatePrivateSpaceView";
import PrivateSpaceMembersView from "./PrivateSpaceMembersView";
import InviteUserView from "./InviteUserView";
import PrivateSpacePostView from "./PrivateSpacePostView";
import CreatePrivateSpacePostView from "./CreatePrivateSpacePostView";

const Stack = createStackNavigator();

function PrivateSpacesNavigator() {
  const route = useRoute();

  return (
    <Stack.Navigator
      initialRouteName="PrivateSpacesList"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6382E8",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="PrivateSpacesList"
        component={PrivateSpacesListView}
        initialParams={route.params}
        options={{ 
          title: "Private Spaces",
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name="PrivateSpace"
        component={PrivateSpaceView}
        initialParams={route.params}
        options={{ title: "Private Space" }}
      />
      <Stack.Screen
        name="CreatePrivateSpace"
        component={CreatePrivateSpaceView}
        initialParams={route.params}
        options={{ title: "Create Private Space" }}
      />
      <Stack.Screen
        name="PrivateSpaceMembers"
        component={PrivateSpaceMembersView}
        initialParams={route.params}
        options={{ title: "Members" }}
      />
      <Stack.Screen
        name="InviteUser"
        component={InviteUserView}
        initialParams={route.params}
        options={{ title: "Invite Member" }}
      />
      <Stack.Screen
        name="PrivateSpacePost"
        component={PrivateSpacePostView}
        initialParams={route.params}
        options={{ title: "Post" }}
      />
      <Stack.Screen
        name="CreatePrivateSpacePost"
        component={CreatePrivateSpacePostView}
        initialParams={route.params}
        options={{ title: "Create Post" }}
      />
    </Stack.Navigator>
  );
}

export default PrivateSpacesNavigator; 