import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
//import App from './App';

import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Home from "./Components/Pages/Home";
import Register from "./Components/Pages/Register";
//import LightRays from './ReactBits/Bground';
import Dashboard from "./Components/Pages/Dashboard";
import Login from "./Components/Pages/Login";
import { UserProvider } from "./context/userContext";
import Navbar from "./Components/Navbar/Navbar";

const Layout = () => {
  return (
    <div>
      <Navbar/>
      <Outlet />
    </div>
  );
};
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
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
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
);
