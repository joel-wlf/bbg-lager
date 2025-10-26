import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { pb } from "@/lib/pocketbase";

interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    if (pb.authStore.isValid) {
      setUser(pb.authStore.record);
    }
    setIsLoading(false);

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange(() => {
      if (pb.authStore.isValid) {
        setUser(pb.authStore.record);
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);
    setUser(authData.record);
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
