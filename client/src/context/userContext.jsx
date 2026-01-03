import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
        throw new Error("Not authenticated");
      }

      const data = await res.json();
      // Phoenix returns the user object directly based on our UserController
      setUser(data); 
      console.log("User session verified:", data);
    } catch (err) {
      console.log("No active session found.");
      setUser(null);
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