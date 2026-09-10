import { Platform } from "react-native";
import { auth } from "../config/firebase";

const getApiUrl = () => {
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (configuredApiUrl) {
    return configuredApiUrl.endsWith("/api")
      ? configuredApiUrl
      : `${configuredApiUrl}/api`;
  }

  if (__DEV__) {
    return Platform.OS === "android"
      ? "http://10.196.173.179:5000/api"
      : "http://localhost:5000/api";
  }

  return "";
};

export const API_URL = getApiUrl();

interface ApiOptions {
  method?: string;
  body?: any;
}

interface ApiRequestOptions extends ApiOptions {
  onUnauthorized?: () => void;
}

// Custom timeout implementation for React Native
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number = 30000,
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {},
) {
  try {
    const user = auth.currentUser;
    const publicEndpoints = ["/auth/login", "/auth/register"];
    let token: string | null = null;

    if (user && !publicEndpoints.includes(endpoint)) {
      try {
        token = await user.getIdToken();
      } catch (tokenError) {
        console.error("Failed to get ID token:", tokenError);
        if (options.onUnauthorized) {
          options.onUnauthorized();
        }
        throw new Error("User session invalid. Please log in again.");
      }
    }

    const { method = "GET", body } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetchWithTimeout(
      `${API_URL}${endpoint}`,
      config,
      30000,
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (options.onUnauthorized) {
          options.onUnauthorized();
        }
        throw new Error("Your session has expired. Please log in again.");
      }

      let errorMessage: string;
      const responseClone = response.clone();
      try {
        const errorData = await responseClone.json();
        errorMessage =
          errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        errorMessage = await response.text();
      }

      switch (response.status) {
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 403:
          throw new Error("You don't have permission to perform this action.");
        case 404:
          throw new Error(`The requested resource was not found: ${endpoint}`);
        case 413:
          throw new Error("The file you're trying to upload is too large.");
        case 429:
          throw new Error("Too many requests. Please try again later.");
        case 500:
          throw new Error(
            "An unexpected server error occurred. Please try again later.",
          );
        default:
          throw new Error(`Request failed: ${errorMessage}`);
      }
    }

    try {
      return await response.json();
    } catch (parseError) {
      return null;
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your internet connection.");
    } else if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

// Posts API
export const postsApi = {
  getAllPosts: (onUnauthorized?: () => void) =>
    apiRequest("/posts", { onUnauthorized }),

  createPost: (
    data: {
      description: string;
      location: string;
      image: string | undefined;
      hashtags: string;
    },
    onUnauthorized?: () => void,
  ) => apiRequest("/posts", { method: "POST", body: data, onUnauthorized }),

  updatePost: (
    postId: string,
    data: {
      description?: string;
      location?: string;
      image?: string;
      hashtags?: string;
    },
  ) => apiRequest(`/posts/${postId}`, { method: "PUT", body: data }),

  deletePost: (postId: string) =>
    apiRequest(`/posts/${postId}`, { method: "DELETE" }),

  likePost: (postId: string) =>
    apiRequest(`/posts/${postId}/like`, { method: "POST" }),

  addComment: (postId: string, text: string) =>
    apiRequest(`/posts/${postId}/comments`, {
      method: "POST",
      body: { text },
    }),

  deleteComment: (postId: string, commentId: string) =>
    apiRequest(`/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    }),
};

// Profile API
export const profileApi = {
  getProfile: (onUnauthorized?: () => void) =>
    apiRequest("/profile", { onUnauthorized }),

  updateProfile: (data: { name?: string; avatar?: string }) =>
    apiRequest("/profile", { method: "PUT", body: data }),
};

// Rewards API
export const rewardsApi = {
  getRewards: () => apiRequest("/rewards"),

  claimReward: (rewardId: string) =>
    apiRequest(`/rewards/${rewardId}/claim`, { method: "POST" }),
};
