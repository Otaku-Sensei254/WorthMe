import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true); // Added loading state

  const fetchUser = async () => {
    try {
      // 1. Corrected URL to /api/me
      // 2. Added credentials: "include" to send the Phoenix cookie
      const res = await fetch("http://localhost:4000/api/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
      });

      if (!res.ok) {
        // Only clear local user cache on real auth failures.
        const error = new Error("Not authenticated");
        error.status = res.status;
        throw error;
      }

      const data = await res.json();
      // Phoenix returns the user object directly based on our UserController
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      console.log("User session verified:", data);
    } catch (err) {
      // If the backend is down / network fails, keep whatever is in localStorage so
      // the app can still show cached statement results after refresh.
      const isAuthFailure = err?.message === "Not authenticated" || err?.status === 401;
      if (isAuthFailure) {
        console.log("No active session found.");
        setUser(null);
        localStorage.removeItem("user");
      } else {
        console.log("Session check failed (offline/back-end down). Using cached user.");
        // Keep existing user state (initialized from localStorage).
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
