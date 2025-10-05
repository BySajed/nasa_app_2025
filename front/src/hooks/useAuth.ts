import { useState, useEffect } from "react";
import { authApi } from "../api/auth";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const updateAuthState = () => {
    const token = authApi.getToken();
    const username = authApi.getUsername();
    console.log("updateAuthState - token:", token, "username:", username);
    setIsAuthenticated(!!token);
    setUsername(username);
  };

  useEffect(() => {
    updateAuthState();
    setIsLoading(false);

    const handleAuthChange = () => {
      console.log("Événement auth-changed reçu");
      updateAuthState();
    };

    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await authApi.login({ username, password });
      setIsAuthenticated(true);
      setUsername(username);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      setUsername(null);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUsername(null);
    window.dispatchEvent(new CustomEvent("auth-changed"));
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    username,
  };
};
