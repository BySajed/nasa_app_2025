import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authApi } from "../api/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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

  const refreshAuth = () => {
    updateAuthState();
  };

  useEffect(() => {
    updateAuthState();
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await authApi.login({ username, password });
      updateAuthState();
      return true;
    } catch (error) {
      updateAuthState();
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      await authApi.register({ username, password });
      updateAuthState();
      return true;
    } catch (error) {
      updateAuthState();
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    updateAuthState();
  };

  const value = {
    isAuthenticated,
    isLoading,
    username,
    login,
    register,
    logout,
    refreshAuth,  
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
