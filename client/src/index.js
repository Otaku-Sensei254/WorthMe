import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from "react-router-dom";

// Pages & Components
import Home from "./Components/Pages/Home";
import Register from "./Components/Pages/Register";
import Dashboard from "./Components/Pages/Dashboard";
import Login from "./Components/Pages/Login";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import InitialPageLoader from "./Components/InitialPageLoader";
import BankConnect from "./banks/BankConnect";
import Profile from "./Components/Pages/Profile";
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
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className={isDashboard ? "dashboard-shell-layout" : "public-shell-layout"}>
      {!isDashboard && !isAuthPage && <Navbar />}
      <div className="app-layout-content">
        <Outlet />
      </div>
      {!isDashboard && !isAuthPage && <Footer />}
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
        element: <Navigate to="/" replace />,
      },
      {
        path: "features",
        element: <Navigate to="/#how-it-works" replace />,
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
      {
        path: "banks/connect/:bankId",
        element: (
          <ProtectedRoute>
            <BankConnect />
          </ProtectedRoute>
        ),
      },
      {
        path: "banks",
        element: (
          <ProtectedRoute>
            <Banks />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "login",
        element: <Login />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UserProvider>
      <WealthProvider>
        <>
          <RouterProvider router={router} />
          <InitialPageLoader />
        </>
      </WealthProvider>
    </UserProvider>
  </React.StrictMode>
);
