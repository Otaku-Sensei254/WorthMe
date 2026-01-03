import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

// Pages & Components
import Home from "./Components/Pages/Home";
import Register from "./Components/Pages/Register";
import Dashboard from "./Components/Pages/Dashboard";
import Login from "./Components/Pages/Login";
import Navbar from "./Components/Navbar/Navbar";
import BankConnect from "./banks/BankConnect";
// Context & Protection
import { UserProvider } from "./context/userContext";
import ProtectedRoute from "./Components/ProtectedRoutes";
import Mpesa from "./Components/Parsers/Mpesa";
import Banks from "./banks/Banks";

/**
 * Layout component to wrap pages with a persistent Navbar
 */
const Layout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
};

/**
 * Router Configuration
 * ProtectedRoute is used inside the 'element' prop for specific routes
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true, // This acts as the default "/" path
        element: <Home />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
         {
        path: "mpesa",
        element: (
          <ProtectedRoute>
            <Mpesa />
          </ProtectedRoute>
        ),
      },
      // ADD THIS NEW ROUTE:
      {
        path: "banks/connect/:bankId",
        element: (
          <ProtectedRoute>
            <BankConnect />
          </ProtectedRoute>
        ),
      },
      {
       path: "/banks",
       element: <Banks />,
     },
    ],
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UserProvider>
      {/* The RouterProvider provides the "Router Context" 
        needed by ProtectedRoute and Navigate 
      */}
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
);