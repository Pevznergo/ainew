'use client';

import { createContext, useContext, useState, } from 'react';
import type { Session } from 'next-auth';

interface UserContextType {
  user: Session['user'] | null;
  setUser: (user: Session['user'] | null) => void;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: Session['user'] | null;
}) {
  const [user, setUser] = useState<Session['user'] | null>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
