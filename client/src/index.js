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
import Profile from "./Components/Pages/Profile";
import About from "./Components/Pages/About";
import Features from "./Components/Pages/Features";
// Context & Protection
import { UserProvider } from "./context/userContext";
import { WealthProvider } from "./context/wealthContext";
import ProtectedRoute from "./Components/ProtectedRoutes";
import Mpesa from "./Components/Parsers/Mpesa";
import Airtel from "./Components/Parsers/Airtel";
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
        path: "about",
        element: <About />,
      },
      {
        path: "features",
        element: <Features />,
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
      {
        path: "airtel",
        element: (
          <ProtectedRoute>
            <Airtel />
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
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
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
      <WealthProvider>
        {/* The RouterProvider provides the "Router Context"
          needed by ProtectedRoute and Navigate
        */}
        <RouterProvider router={router} />
      </WealthProvider>
    </UserProvider>
  </React.StrictMode>
);
