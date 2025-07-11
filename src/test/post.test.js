global.fetch = jest.fn();

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn() }), { virtual: true });

jest.mock("react-native", () => ({ Alert: { alert: jest.fn() } }), { virtual: true });

jest.mock("../Controller/CheckLikedPostCommand", () => ({
  checkLikePost: jest.fn(),
}), { virtual: true });

jest.mock("@env", () => ({
  apiUrl: "http://localhost:3000",
  createPostRoute: "/posts/create",
  getPostLikesRoute: "/getPostLikes",
  likePostRoute: "/likePost",
  checkLikedPostRoute: "/checkLikedPost",
  unlikePostRoute: "/unlikePost",
  approvePostRoute:   "/approvePost",
  deletePostRoute:    "/deletePost",
  approvedPostsRoute: "/getAllApprovedPosts",
}), { virtual: true });

const { approvedPostsRoute, approvePostRoute, deletePostRoute } = jest.requireMock("@env");

import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import Post from "../Model/Posts/Post";

// Import the functions to be tested
import CreatePost from "../Controller/CreatePostCommand";
import { likePost } from "../Controller/LikePostCommand";
import { checkLikePost } from "../Controller/CheckLikedPostCommand";
import { getPostLikes } from "../Controller/GetPostLikesCommand";
import { unlikePost } from "../Controller/UnlikePostCommand";
import { getApprovedPosts, approvePost, deletePost } from "../Controller/PostManager";

// Mocking the file and navigation objects 
const file = { url: "http://example.com/file", type: "image/png", name: "test.png" };
const nav  = { navigate: jest.fn() };
const user = { userUserName: "testuser", createPost: jest.fn() };

// Before each test, clear mocks to ensure no state is carried over
beforeEach(() => {
  jest.clearAllMocks();
  SecureStore.getItemAsync.mockResolvedValue("TOKEN");
});

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("Test Initializing Post", () => {
  it("Full Post", () => {
    const post = new Post(
      1, // Post ID
      "user", // User who created the post
      "Post Title", // Title of the post
      "This is the post content.", // Content of the post
      0, // Number of likes
      null, // Comments on the post
      null, // File URL (optional)
      "Community Name", // Community name (optional)
      0 // Comments count
    );
    expect(post.id).toBe(1);
    expect(post.user).toBe("user");
    expect(post.title).toBe("Post Title");
    expect(post.postContent).toBe("This is the post content.");
    expect(post.likes).toBe(0);
    expect(post.comments).toBeNull();
    expect(post.communityName).toBe("Community Name");
    expect(post.commentsCount).toBe(0);
  });
  it("Partial Post", () => {
    const post = new Post(
      1, // Post ID
      "user", // User who created the post
      "Post Title", // Title of the post
      null, // Content of the post
      0, // Number of likes
      null, // Comments on the post
      null, // File URL (optional)
      "Community Name", // Community name (optional)
      0 // Comments count
    );
    expect(post.id).toBe(1);
    expect(post.user).toBe("user");
    expect(post.title).toBe("Post Title");
    expect(post.postContent).toBeNull();
    expect(post.likes).toBe(0);
    expect(post.comments).toBeNull();
    expect(post.communityName).toBe("Community Name");
    expect(post.commentsCount).toBe(0);
  });
    it("Empty Post", () => {
    const post = new Post(
      1, // Post ID
      "user", // User who created the post
      null, // Title of the post
      null, // Content of the post
      null, // Number of likes
      null, // Comments on the post
      null, // File URL (optional)
      null, // Community name (optional)
      null // Comments count
    );
    expect(post.id).toBe(1);
    expect(post.user).toBe("user");
    expect(post.title).toBeNull();
    expect(post.postContent).toBeNull();
    expect(post.likes).toBeNull();
    expect(post.comments).toBeNull();
    expect(post.communityName).toBeNull();
    expect(post.commentsCount).toBeNull();
  });
  it("Initialize Busy Post", () => {
    const post = new Post(
      1, // Post ID
      "user", // User who created the post
      "Post Title", // Title of the post
      "This is the post content.", // Content of the post
      5, // Number of likes
      ["nice post!", "great read!", "informative article"], // Comments on the post
      null, // File URL (optional)
      "Best Community", // Community name (optional)
      3 // Comments count
    );
    expect(post.id).toBe(1);
    expect(post.user).toBe("user");
    expect(post.title).toBe("Post Title");
    expect(post.postContent).toBe("This is the post content.");
    expect(post.likes).toBe(5);
    expect(post.comments).toEqual(["nice post!", "great read!", "informative article"]);
    expect(post.fileUrl).toBeNull();
    expect(post.communityName).toBe("Best Community");
    expect(post.commentsCount).toBe(3);
  });
});

describe("Test CreatePost()", () => {
  it("happy-path", async () => {
    fetch.mockResolvedValueOnce({ status: 200, json: async () => ({}) });
    await CreatePost({ navigation: nav }, "Test Title", "Test Content", file, user);

    expect(fetch).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Post created");
    expect(nav.navigate).toHaveBeenCalledWith("Home");
    expect(user.createPost).toHaveBeenCalled();
  });

  it("guard clause: does nothing when content is empty", async () => {
    await CreatePost({ navigation: nav }, "Test Title", "", file, user);

    expect(fetch).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("error-path: handles non-200 response", async () => {
    fetch.mockResolvedValueOnce({ status: 500, json: async () => ({}) });
    await CreatePost({ navigation: nav }, "Test Title", "Test Content", file, user);

    expect(fetch).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Unable to create post");
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(user.createPost).not.toHaveBeenCalled();
  });
});

describe("Test getPostLikes()", () => {
  test("returns likes when API responds 200", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ likes: 5 }) });
    const likes = await getPostLikes(42);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/getPostLikes"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ postID: 42 }),
      })
    );
    expect(likes).toBe(5);
  });

  test("returns 0 when response.ok is false", async () => {
    fetch.mockResolvedValueOnce({ ok: false });
    const likes = await getPostLikes(7);

    expect(likes).toBe(0);
  });

  test("returns 0 when fetch throws", async () => {
    fetch.mockRejectedValueOnce(new Error("Network down"));
    const likes = await getPostLikes(99);

    expect(likes).toBe(0);
  });
});

describe("Test CheckLikePost() and likePost()", () => {
  const post = { id: 1 };
  const userEmail = "nick@example.com";

  test("returns false and skips fetch when already liked", async () => {
    checkLikePost.mockResolvedValueOnce(true);
    const result = await likePost(post, userEmail);

    expect(result).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("happy-path – returns true when API responds 200", async () => {
    checkLikePost.mockResolvedValueOnce(false);
    fetch.mockResolvedValueOnce({ status: 200 });
    const result = await likePost(post, userEmail);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/likePost"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userEmail, postId: post.id }),
        headers: expect.objectContaining({
          Authorization: "Bearer TOKEN",
        }),
      })
    );
    expect(result).toBe(true);
  });

  test("returns false when backend status ≠ 200", async () => {
    checkLikePost.mockResolvedValueOnce(false);
    fetch.mockResolvedValueOnce({ status: 500 });
    const result = await likePost(post, userEmail);

    expect(result).toBe(false);
  });

  test("returns false when fetch throws", async () => {
    checkLikePost.mockResolvedValueOnce(false);
    fetch.mockRejectedValueOnce(new Error("network down"));
    const result = await likePost(post, userEmail);

    expect(result).toBe(false);
  });
});

describe("Test getPostLikes()", () => {
  test("returns likes when API responds 200", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likes: 7 }),
    });
    const likes = await getPostLikes(123);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/getPostLikes"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ postID: 123 }),
      })
    );
    expect(likes).toBe(7);
  });

  test("returns 0 when response.ok is false", async () => {
    fetch.mockResolvedValueOnce({ ok: false });
    const likes = await getPostLikes(456);

    expect(likes).toBe(0);
  });

  test("returns 0 when fetch throws", async () => {
    fetch.mockRejectedValueOnce(new Error("network down"));
    const likes = await getPostLikes(789);

    expect(likes).toBe(0);
  });
});

describe("Test unlikePost()", () => {
  const post = { id: 99 };
  const userEmail = "nick@example.com";

  test("happy-path → returns true when backend responds 200", async () => {
    fetch.mockResolvedValueOnce({ status: 200 });
    const result = await unlikePost(post, userEmail);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/unlikePost"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userEmail, postId: post.id }),
        headers: expect.objectContaining({
          Authorization: "Bearer TOKEN",
        }),
      })
    );
    expect(result).toBe(true);
  });

  test("returns false when backend status ≠ 200", async () => {
    fetch.mockResolvedValueOnce({ status: 500 });
    const result = await unlikePost(post, userEmail);

    expect(result).toBe(false);
  });

  test("returns false when fetch throws", async () => {
    fetch.mockRejectedValueOnce(new Error("network down"));
    const result = await unlikePost(post, userEmail);

    expect(result).toBe(false);
  });
});

describe("PostManager helpers Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  test("getApprovedPosts() returns Post instances built from backend data", async () => {
    const dummyData = {
      data: [
        {
          postid: 1,
          email: "a@example.com",
          title: "First",
          content: "Alpha",
          likescount: 10,
          fileurl: null,
          communityname: "ComA",
          commentscount: 2,
        },
        {
          postid: 2,
          email: "b@example.com",
          title: "Second",
          content: "Beta",
          likescount: 5,
          fileurl: "http://x",
          communityname: "ComB",
          commentscount: 0,
        },
      ],
    };

    fetch.mockResolvedValueOnce({
      json: async () => dummyData,
    });
    const posts = await getApprovedPosts("nick@example.com");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${approvedPostsRoute}?userEmail=nick@example.com`),
      expect.objectContaining({ method: "GET" })
    );
    expect(posts).toHaveLength(2);
    expect(posts[0]).toBeInstanceOf(Post);
    expect(posts[0].title).toBe("Second");
    expect(posts[1].title).toBe("First");
  });

  test("Test approvePost() success", async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({}),
    });
    await approvePost(99);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(approvePostRoute),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: 99 }),
      })
    );
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Post is approved");
  });

  test("Test approvePost() error", async () => {
    fetch.mockResolvedValueOnce({
      status: 500,
      json: async () => ({}),
    });
    await approvePost(100);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      expect.stringContaining("Server error")
    );
  });

  test("Test deletePost() success", async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      text: async () => JSON.stringify({ message: "Deleted!" }),
    });
    await deletePost(55);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${deletePostRoute}/55`),
      expect.objectContaining({ method: "DELETE" })
    );
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Deleted!");
  });

  test("Test deletePost() error", async () => {
    fetch.mockResolvedValueOnce({
      status: 400,
      text: async () => JSON.stringify({ message: "Bad ID" }),
    });
    await deletePost(56);

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Bad ID");
  });
});