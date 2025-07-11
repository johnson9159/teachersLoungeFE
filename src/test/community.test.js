global.fetch = jest.fn();

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn() }), { virtual: true });
jest.mock("react-native", () => ({ Alert: { alert: jest.fn() } }), { virtual: true });

jest.mock("@env", () => ({
  apiUrl: "http://localhost:3000",
  allCommunitiesRoute:         "/getAllCommunities",
  userCommunitiesRoute:        "/getUserCommunities",
  communityPostsRoute:         "/getCommunityApprovedPosts",
  createCommunityRoute:        "/createNewCommunity",
  joinCommunityRoute:          "/joinCommunity",
  leaveCommunityRoute:         "/leaveCommunity",
  createCommunityPostRoute:    "/createCommunityPost",
}), { virtual: true });

const env = jest.requireMock("@env");
const {
  allCommunitiesRoute,
  userCommunitiesRoute,
  communityPostsRoute,
  createCommunityRoute,
  leaveCommunityRoute,
} = jest.requireMock("@env");

import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import Community from "../Model/Community";
import Post from "../Model/Posts/Post";

import {
  getAllCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getUserCommunities,
  getCommunityPosts,
  createCommunityPost,
} from "../Controller/CommunitiesManager";

const nav = { navigate: jest.fn(), goBack: jest.fn() };
const user = { userUserName: "joe@site.com", createPost: jest.fn() };
const file = { url: "http://img", type: "image/png", name: "pic.png" };

beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItemAsync.mockResolvedValue("TOKEN");
});

describe("Community model", () => {
  it("initialises with id + name", () => {
    const c = new Community(1, "Alpha");
    expect(c.id).toBe(1);
    expect(c.name).toBe("Alpha");
  });

  it("allows empty constructor", () => {
    const c = new Community();
    expect(c.id).toBeUndefined();
    expect(c.name).toBeUndefined();
  });
});

describe("Test getAllCommunities()", () => {
  it("maps backend data to Community instances", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        data: [
          { communityid: 1, communityname: "Alpha" },
          { communityid: 2, communityname: "Beta" },
        ],
      }),
    });

    const list = await getAllCommunities();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(allCommunitiesRoute),
      expect.objectContaining({ method: "GET" })
    );
    expect(list).toHaveLength(2);
    expect(list[0]).toBeInstanceOf(Community);
    expect(list[0].name).toBe("Beta");
  });
});

describe("Test createCommunity()", () => {
  it("success path (201) navigates & alerts", async () => {
    fetch.mockResolvedValueOnce({ status: 201, json: async () => ({}) });

    await createCommunity({ navigation: nav }, "Chess");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(createCommunityRoute),
      expect.objectContaining({ method: "POST" })
    );
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Community created");
    expect(nav.navigate).toHaveBeenCalledWith("Communities");
  });

  it("shows error on non-201", async () => {
    fetch.mockResolvedValueOnce({ status: 400, json: async () => ({}) });
    await createCommunity({ navigation: nav }, "Chess");
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Unable to create community");
  });
  it("guard clause: no network call when name empty", async () => {
    await createCommunity({ navigation: nav }, "");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Test joinCommunity()", () => {
  it("alerts duplicate on 400", async () => {
    fetch.mockResolvedValueOnce({ status: 400, json: async () => ({}) });
    await joinCommunity({ navigation: nav }, 1, "joe@site.com");
    expect(Alert.alert).toHaveBeenCalledWith("Error", "You are already in this community");
  });

  it("success path (201)", async () => {
    fetch.mockResolvedValueOnce({ status: 201, json: async () => ({}) });
    await joinCommunity({ navigation: nav }, 1, "joe@site.com");
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Community joined");
    expect(nav.navigate).toHaveBeenCalled();
  });
});

describe("Test leaveCommunity()", () => {
  it("success (200) alerts and navigates", async () => {
    fetch.mockResolvedValueOnce({ status: 200, json: async () => ({}) });
    await leaveCommunity({ navigation: nav }, 1, "joe@site.com");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(leaveCommunityRoute),
      expect.objectContaining({ method: "DELETE" })
    );
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Community left");
    expect(nav.navigate).toHaveBeenCalled();
  });
});

describe("Test getUserCommunities()", () => {
  it("returns Community list for user", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        data: [{ communityid: 9, communityname: "Gamma" }],
      }),
    });
    const list = await getUserCommunities("joe@site.com");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(userCommunitiesRoute),
      expect.objectContaining({ method: "GET" })
    );
    expect(list[0]).toBeInstanceOf(Community);
    expect(list[0].name).toBe("Gamma");
  });
});

describe("Test getCommunityPosts()", () => {
  it("maps backend to Post instances", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        data: [
          {
            postid: 2,
            email: "joe@site.com",
            content: "hello",
            likescount: 3,
            fileurl: null,
            communityname: "Chess",
            commentscount: 0,
          },
        ],
      }),
    });

    const posts = await getCommunityPosts(1, "joe@site.com");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(communityPostsRoute),
      expect.objectContaining({ method: "GET" })
    );
    expect(posts[0]).toBeInstanceOf(Post);
    expect(posts[0].title).toBe("hello");
  });
});
