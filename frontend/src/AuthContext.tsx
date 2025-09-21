import { createContext, useState, useContext,type ReactNode } from 'react';
import type { User } from './services/api';

// Define the shape of the data that the context will hold
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// Create the actual context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Provider component. This component will wrap your entire app
// and make the auth data available to all children components.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Function to update the user state upon successful login/signup
  const login = (userData: User) => {
    setUser(userData);
    // In a full production app, you would also save the JWT token to local storage here
  };

  // Function to clear the user state upon logout
  const logout = () => {
    setUser(null);
    // In a full production app, you would clear the JWT token from local storage here
  };

  const value = { user, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Create a custom hook. This is the helper that your components will use
// to easily access the user data without extra boilerplate.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

