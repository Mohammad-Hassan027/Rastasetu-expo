import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { postsApi } from "../lib/api";
import { useAuth } from "./AuthContext";

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  user: User;
  location: string;
  image: string | undefined;
  description: string;
  hashtags: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  createdAt: string;
}

export interface CreatePostData {
  description: string;
  location: string;
  hashtags: string;
  image: string | undefined;
}

export const [TravelPostsProvider, useTravelPosts] = createContextHook(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allPosts = await postsApi.getAllPosts();
      setPosts(
        allPosts.sort(
          (a: Post, b: Post) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  }, []);

  const processImageForUpload = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const base64data = reader.result.split(",")[1];
          resolve(base64data);
        } else {
          reject(new Error("Failed to convert image to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const createPost = useCallback(async (postData: CreatePostData) => {
    if (
      !postData.description.trim() ||
      !postData.location.trim() ||
      !postData.hashtags.trim()
    ) {
      throw new Error("Description, location, and hashtags are required");
    }

    let base64Image: string | undefined = undefined;
    if (postData.image) {
      base64Image = await processImageForUpload(postData.image);
    }

    const newPost = await postsApi.createPost({
      description: postData.description.trim(),
      location: postData.location.trim(),
      image: base64Image,
      hashtags: postData.hashtags.trim(),
    });

    setPosts((prevPosts) => [newPost, ...prevPosts]);
    return newPost;
  }, []);

  const likePost = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    );

    try {
      await postsApi.likePost(postId);
    } catch (error) {
      // Revert on error
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes + 1 : post.likes - 1,
              }
            : post,
        ),
      );
      throw error;
    }
  }, []);

  const addComment = useCallback(
    async (postId: string, commentText: string) => {
      if (!commentText.trim()) {
        throw new Error("Comment cannot be empty");
      }
      if (!currentUser) {
        throw new Error("You must be logged in to comment");
      }

      try {
        const response = await postsApi.addComment(postId, commentText.trim());
        const newComment = response.comment;

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [...post.comments, newComment],
                }
              : post,
          ),
        );

        return newComment;
      } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
      }
    },
    [currentUser],
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      try {
        await postsApi.deleteComment(postId, commentId);

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: post.comments.filter((c) => c.id !== commentId),
                }
              : post,
          ),
        );
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
      }
    },
    [],
  );

  const deletePost = useCallback(async (postId: string) => {
    try {
      await postsApi.deletePost(postId);

      // Remove from local state
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }, []);

  const updatePost = useCallback(
    async (
      postId: string,
      updates: {
        description?: string;
        location?: string;
        hashtags?: string;
        image?: string;
      },
    ) => {
      try {
        let updateData: any = { ...updates };

        // Convert image URI to base64 if provided
        if (updates.image && !updates.image.startsWith("http")) {
          updateData.image = await processImageForUpload(updates.image);
        }

        const updatedPost = await postsApi.updatePost(postId, updateData);

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === postId ? updatedPost : post)),
        );

        return updatedPost;
      } catch (error) {
        console.error("Error updating post:", error);
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return useMemo(
    () => ({
      posts,
      loading,
      error,
      currentUser,
      fetchPosts,
      createPost,
      likePost,
      addComment,
      deleteComment,
      deletePost,
      updatePost,
    }),
    [
      posts,
      loading,
      error,
      currentUser,
      fetchPosts,
      createPost,
      likePost,
      addComment,
      deleteComment,
      deletePost,
      updatePost,
    ],
  );
});
