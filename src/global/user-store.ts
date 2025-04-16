// src/global/user-store.ts
import { User } from "firebase/auth";

class UserStore {
  user: User | null = null;
  listeners: Array<() => void> = [];

  setUser(user: User | null) {
    this.user = user;
    this.listeners.forEach(fn => fn());
  }

  getUser() {
    return this.user;
  }

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== fn);
    };
  }
}

export const GlobalUser = new UserStore();