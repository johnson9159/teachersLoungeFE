global.fetch = jest.fn();

jest.mock("react-native", () => ({ Alert: { alert: jest.fn() } }), { virtual: true });

import PrivateSpace from "../Model/PrivateSpace";
import PrivateSpaceManager from "../Controller/PrivateSpaceManager";

const baseURL = "http://localhost:3000";
const token   = "TOKEN123";

let manager;
beforeEach(() => {
  jest.clearAllMocks();
  manager = new PrivateSpaceManager();
});

describe("createPrivateSpace()", () => {
  it("returns data on 200/ok", async () => {
    const backend = { spaceId: 9, name: "Chess", description: "", avatarUrl: "" };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => backend,
    });
    const res = await manager.createPrivateSpace(
      baseURL,
      token,
      "Chess",
      "",
      ""
    );

    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/createPrivateSpace`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
        body: expect.stringContaining("\"name\":\"Chess\""),
      })
    );
    expect(res).toEqual(backend);
  });

  it("throws when backend not ok", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "duplicate" }),
    });

    await expect(
      manager.createPrivateSpace(baseURL, token, "Chess", "", "")
    ).rejects.toThrow("duplicate");
  });
});

describe("getUserPrivateSpaces()", () => {
  it("maps backend to PrivateSpace instances and caches them", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        spaces: [
          {
            space_id: 1,
            name: "Alpha",
            description: "A",
            avatar_url: "",
            creator_email: "a@x.com",
            created_at: "2024-01-01",
            user_role: "Member",
            member_count: 2,
            post_count: 0,
          },
        ],
      }),
    });
    const list = await manager.getUserPrivateSpaces(baseURL, token);

    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/getUserPrivateSpaces`,
      expect.objectContaining({ method: "GET" })
    );
    expect(list[0]).toBeInstanceOf(PrivateSpace);
    expect(manager.privateSpaces.length).toBe(1);
  });
});

describe("getPrivateSpaceDetails()", () => {
  it("sets currentSpace when ok", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ space: { space_id: 2, name: "Beta" } }),
    });
    await manager.getPrivateSpaceDetails(baseURL, token, 2);

    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/getPrivateSpaceDetails/2`,
      expect.any(Object)
    );
    expect(manager.currentSpace).toEqual({ space_id: 2, name: "Beta" });
  });
});

describe("inviteUser()", () => {
  it("happy-path returns backend data", async () => {
    const backend = { message: "sent" };
    fetch.mockResolvedValueOnce({ ok: true, json: async () => backend });
    const res = await manager.inviteUser(baseURL, token, 1, "bob@x.com");

    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/inviteToPrivateSpace/1`,
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"inviteeEmail\":\"bob@x.com\""),
      })
    );
    expect(res).toEqual(backend);
  });
});

describe("getPosts()", () => {
  it("passes page & limit query params", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ posts: [] }) });
    await manager.getPosts(baseURL, token, 3, 2, 50);

    expect(fetch).toHaveBeenCalledWith(
      `${baseURL}/getPrivateSpacePosts/3?page=2&limit=50`,
      expect.any(Object)
    );
  });
});
