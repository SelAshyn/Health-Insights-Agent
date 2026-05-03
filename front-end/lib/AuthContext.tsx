"use client";
// React Context lets you share data across the component tree without prop drilling.
// "Prop drilling" = passing props through many layers of components just to reach a deep child.
// Instead, we wrap the app in a Provider, and any component can read the value with useContext.

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

// 1. Define the shape of what we're sharing
interface AuthContextType {
  user: User | null;      // null = not logged in, User = logged in
  loading: boolean;       // true while Firebase is checking the session on first load
}

// 2. Create the context with a default value
//    This default is only used if a component reads the context outside of a Provider —
//    which shouldn't happen in practice, but TypeScript needs a default.
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// 3. The Provider component — wraps the app and makes auth state available everywhere
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is a Firebase listener that fires whenever auth state changes:
    // - on first load (checks if a session exists)
    // - when user signs in
    // - when user signs out
    // It returns an "unsubscribe" function — we call it in the cleanup to avoid memory leaks.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // useEffect cleanup: runs when the component unmounts.
    // Without this, the listener would keep running even after the component is gone.
    return () => unsubscribe();
  }, []); // empty dependency array = run once on mount

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Custom hook — a cleaner way to consume the context
//    Instead of: const { user } = useContext(AuthContext)
//    You write:  const { user } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}
