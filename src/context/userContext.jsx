import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; 

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setUser(null);

    try {
      // decode if you want to log/check payload
      const decoded = jwtDecode(token);
      console.log("Decoded token:", decoded);

      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`, // ✅ send token
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      setUser(data.user);
      console.log("User info fetched", data.user);
    } catch (err) {
      console.error("Token fetching error", err);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};
