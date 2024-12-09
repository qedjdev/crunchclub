import React, { createContext, useState, useContext, ReactNode } from 'react';

interface User {
  id: string;
  userId: number;
  username: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  userId: string | null;
  isInitialized: boolean;
  isCurrentUser: boolean;
  login: (userId: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  React.useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUser = localStorage.getItem('user');
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn');

    if (storedUserId && storedIsLoggedIn === 'true' && storedUser) {
      setIsLoggedIn(true);
      setUserId(storedUserId);
      setUser(JSON.parse(storedUser));
    }
    setIsInitialized(true);
  }, []);

  const login = (userId: string, userData: User) => {
    setIsLoggedIn(true);
    setUserId(userId);
    setUser(userData);
    localStorage.setItem('userId', userId);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setUser(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      userId,
      user,
      isCurrentUser: true,
      isInitialized,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};