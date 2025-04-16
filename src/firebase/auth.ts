import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { app } from "./config";
import { GlobalUser } from '@/global/user-store';

const auth = getAuth(app);

export type AuthContext = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
};

export const useAuth = (): AuthContext  => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      GlobalUser.setUser(user); // Update the global singleton
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();    
  }, []);

  const signUp = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      GlobalUser.setUser(userCredential.user); // Update global
      setUser(userCredential.user);            // Update local state
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      GlobalUser.setUser(userCredential.user); // Update global
      setUser(userCredential.user);            // Update local state
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      GlobalUser.setUser(null); // Clear global
      setUser(null);            // Clear local state
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return { user, loading, signUp, signIn, signOut };
};