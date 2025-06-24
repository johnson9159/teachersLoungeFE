import PrivateSpace from "../Model/PrivateSpace";

class PrivateSpaceManager {
  constructor() {
    this.privateSpaces = [];
    this.currentSpace = null;
  }

  // Create a new private space
  async createPrivateSpace(baseURL, token, name, description, avatarUrl) {
    try {
      const response = await fetch(`${baseURL}/createPrivateSpace`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          avatarUrl,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create private space");
      }

      return data;
    } catch (error) {
      console.error("Error creating private space:", error);
      throw error;
    }
  }

  // Get all private spaces for the current user
  async getUserPrivateSpaces(baseURL, token) {
    try {
      const url = `${baseURL}/getUserPrivateSpaces`;
      console.log("Fetching from URL:", url);
      console.log("Using token:", token ? "Present" : "Missing");
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch private spaces");
      }

      this.privateSpaces = data.spaces.map(
        (space) =>
          new PrivateSpace(
            space.space_id,
            space.name,
            space.description,
            space.avatar_url,
            space.creator_email,
            space.created_at,
            space.user_role,
            space.member_count,
            space.post_count
          )
      );

      return this.privateSpaces;
    } catch (error) {
      console.error("Error fetching private spaces:", error);
      throw error;
    }
  }

  // Get details of a specific private space
  async getPrivateSpaceDetails(baseURL, token, spaceId) {
    try {
      const response = await fetch(`${baseURL}/getPrivateSpaceDetails/${spaceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch space details");
      }

      this.currentSpace = data.space;
      return data;
    } catch (error) {
      console.error("Error fetching space details:", error);
      throw error;
    }
  }

  // Invite a user to private space
  async inviteUser(baseURL, token, spaceId, inviteeEmail) {
    try {
      const response = await fetch(`${baseURL}/inviteToPrivateSpace/${spaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inviteeEmail,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send invitation");
      }

      return data;
    } catch (error) {
      console.error("Error inviting user:", error);
      throw error;
    }
  }

  // Accept invitation to private space
  async acceptInvitation(baseURL, token, invitationId) {
    try {
      const response = await fetch(`${baseURL}/acceptPrivateSpaceInvitation/${invitationId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to accept invitation");
      }

      return data;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  }

  // Get pending invitations
  async getPendingInvitations(baseURL, token) {
    try {
      const response = await fetch(`${baseURL}/getPendingInvitations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch invitations");
      }

      return data.invitations;
    } catch (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }
  }

  // Create a post in private space
  async createPost(baseURL, token, spaceId, content, fileUrl) {
    try {
      const response = await fetch(`${baseURL}/createPrivateSpacePost/${spaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          fileUrl,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      return data;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  // Get posts from private space
  async getPosts(baseURL, token, spaceId, page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${baseURL}/getPrivateSpacePosts/${spaceId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch posts");
      }

      return data;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }

  // Add comment to post
  async addComment(baseURL, token, postId, content) {
    try {
      const response = await fetch(`${baseURL}/addPrivateSpaceComment/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to add comment");
      }

      return data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Get comments for post
  async getComments(baseURL, token, postId) {
    try {
      const response = await fetch(`${baseURL}/getPrivateSpaceComments/${postId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch comments");
      }

      return data.comments || [];
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  }

  // Get members of private space
  async getMembers(baseURL, token, spaceId) {
    try {
      const response = await fetch(`${baseURL}/getPrivateSpaceMembers/${spaceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch members");
      }

      return data.members;
    } catch (error) {
      console.error("Error fetching members:", error);
      throw error;
    }
  }

  // Remove member from private space
  async removeMember(baseURL, token, spaceId, memberEmail) {
    try {
      const response = await fetch(`${baseURL}/removePrivateSpaceMember/${spaceId}/${memberEmail}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove member");
      }

      return data;
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  }

  // Delete post from private space
  async deletePost(baseURL, token, postId) {
    try {
      const response = await fetch(`${baseURL}/deletePrivateSpacePost/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete post");
      }

      return data;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  // Get users that can be invited to private space
  async getInvitableUsers(baseURL, token, spaceId) {
    try {
      const response = await fetch(`${baseURL}/getInvitableUsers/${spaceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch invitable users");
      }

      return data.users;
    } catch (error) {
      console.error("Error fetching invitable users:", error);
      throw error;
    }
  }

  // Search users for invitation
  async searchInvitableUsers(baseURL, token, spaceId, searchQuery) {
    try {
      const response = await fetch(
        `${baseURL}/searchInvitableUsers/${spaceId}?query=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to search users");
      }

      return data.users;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  // Dissolve private space (admin only)
  async dissolveSpace(baseURL, token, spaceId) {
    try {
      const response = await fetch(`${baseURL}/dissolvePrivateSpace/${spaceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to dissolve private space");
      }

      // Remove the space from local cache
      this.privateSpaces = this.privateSpaces.filter(
        space => space.spaceId !== spaceId
      );

      return data;
    } catch (error) {
      console.error("Error dissolving private space:", error);
      throw error;
    }
  }
}

export default PrivateSpaceManager; 