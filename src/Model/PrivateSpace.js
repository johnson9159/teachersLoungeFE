import React from "react";

class PrivateSpace {
  constructor(spaceId, name, description, avatarUrl, creatorEmail, createdAt, userRole, memberCount, postCount) {
    // Unique identifier for the private space
    this.spaceId = spaceId;
    // Name of the private space
    this.name = name;
    // Description of the private space
    this.description = description;
    // Avatar URL for the space
    this.avatarUrl = avatarUrl;
    // Email of the creator
    this.creatorEmail = creatorEmail;
    // Creation timestamp
    this.createdAt = createdAt;
    // Current user's role in the space (admin/member)
    this.userRole = userRole;
    // Total number of members
    this.memberCount = memberCount;
    // Total number of posts
    this.postCount = postCount;
  }
}

export default PrivateSpace; 