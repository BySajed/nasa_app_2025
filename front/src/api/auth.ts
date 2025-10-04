import { apiClient } from "./client";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthError {
  detail: string;
}

export interface User {
  id: number;
  username: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient
        .post("auth/login", {
          json: credentials,
        })
        .json<LoginResponse>();

      localStorage.setItem("access_token", response.access_token);

      const userInfo = await apiClient.get("auth/me").json<User>();
      localStorage.setItem("username", userInfo.username);

      return response;
    } catch (error: unknown) {
      if (error instanceof Response) {
        const errorData = (await error.json()) as AuthError;
        throw new Error(errorData.detail || "Erreur de connexion");
      }
      throw new Error("Erreur de connexion au serveur");
    }
  },

  logout(): void {
    localStorage.removeItem("access_token");
  },

  getToken(): string | null {
    return localStorage.getItem("access_token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getUsername(): string | null {
    return localStorage.getItem("username");
  },
};
