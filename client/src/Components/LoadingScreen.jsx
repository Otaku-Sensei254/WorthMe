import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./styles/LoadingScreen.css";

const LoadingScreen = ({ message = "All your wealth. One calm place.", ariaLabel = "Loading WorthMe" }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="loading-screen"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="loading-screen-content"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.42, delay: shouldReduceMotion ? 0 : 0.08 }}
      >
        <div className="loading-screen-wordmark" aria-hidden="true">
          Worth<span>Me</span>
        </div>
        <p className="loading-screen-message">{message}</p>
        <div className="loading-screen-track" aria-hidden="true">
          <motion.span
            className="loading-screen-progress"
            animate={shouldReduceMotion ? { x: 0 } : { x: ["-110%", "310%"] }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.25, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
