import React, { useContext, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { UserContext } from "../context/userContext";
import LoadingScreen from "./LoadingScreen";

const InitialPageLoader = () => {
  const { loading } = useContext(UserContext);
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const isVisible = loading || !minimumElapsed;

  return (
    <AnimatePresence>
      {isVisible && (
        <LoadingScreen key="initial-loader" />
      )}
    </AnimatePresence>
  );
};

export default InitialPageLoader;
