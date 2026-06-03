import { describe, expect, it } from "vitest";

import {
  mapCommentWithUser,
  mapPostWithUser
} from "@/db/linkit-store";

const createdAt = new Date("2026-05-24T08:00:00.000Z");
const updatedAt = new Date("2026-05-24T08:30:00.000Z");

const dbUser = {
  id: "98e315a4-db75-4dc8-a77d-425de832bbf6",
  legacyId: 42,
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: null,
  image: "https://example.com/ada.png",
  passwordHash: null,

  createdAt,
  updatedAt
};

describe("Postgres Linkit store mapping", () => {
  it("maps a post joined with its user into the domain shape", () => {
    expect(
      mapPostWithUser({
        post: {
          id: "edbdf483-b872-459f-a320-8831d02022f7",
          legacyId: 7,
          userId: dbUser.id,
          title: "A useful link",
          body: "A description imported from metadata.",
          link: "https://example.com/story",
          thumbnailUrl: "https://example.com/thumb.jpg",
          profileThumbnailUrl: null,
          providerName: "Example",
          clickCount: 12,
          commentsCount: 3,
          createdAt,
          updatedAt
        },
        user: dbUser
      })
    ).toEqual({
      id: "edbdf483-b872-459f-a320-8831d02022f7",
      legacyId: 7,
      title: "A useful link",
      body: "A description imported from metadata.",
      link: "https://example.com/story",
      thumbnailUrl: "https://example.com/thumb.jpg",
      profileThumbnailUrl: null,
      providerName: "Example",
      clickCount: 12,
      commentsCount: 3,
      user: {
        id: dbUser.id,
        email: "ada@example.com",
        name: "Ada Lovelace",
      
        imageUrl: "https://example.com/ada.png"
      },
      createdAt,
      updatedAt
    });
  });

  it("falls back to email when an imported user has no display name", () => {
    const post = mapPostWithUser({
      post: {
        id: "edbdf483-b872-459f-a320-8831d02022f7",
        legacyId: null,
        userId: dbUser.id,
        title: "Untitled",
        body: null,
        link: "https://example.com/untitled",
        thumbnailUrl: null,
        profileThumbnailUrl: null,
        providerName: "Pending source",
        clickCount: 0,
        commentsCount: 0,
        createdAt,
        updatedAt
      },
      user: {
        ...dbUser,
        name: null,
        image: null
      }
    });

    expect(post.user).toEqual({
      id: dbUser.id,
      email: "ada@example.com",
      name: "ada@example.com",
    
      imageUrl: null
    });
  });

  it("maps a comment joined with its user into the domain shape", () => {
    expect(
      mapCommentWithUser({
        comment: {
          id: "011f6067-fb7c-4465-b5f8-bdd4a9d50da7",
          legacyId: 55,
          postId: "edbdf483-b872-459f-a320-8831d02022f7",
          userId: dbUser.id,
          body: "This belongs in the feed.",
          parentId: null,
          replyToUserName: null,
          replyCount: 0,
          createdAt,
          updatedAt
        },
        user: dbUser
      })
    ).toEqual({
      id: "011f6067-fb7c-4465-b5f8-bdd4a9d50da7",
      legacyId: 55,
      postId: "edbdf483-b872-459f-a320-8831d02022f7",
      body: "This belongs in the feed.",
      parentId: null,
      replyToUserName: null,
      replyCount: 0,
      user: {
        id: dbUser.id,
        email: "ada@example.com",
        name: "Ada Lovelace",
      
        imageUrl: "https://example.com/ada.png"
      },
      createdAt,
      updatedAt
    });
  });
});
