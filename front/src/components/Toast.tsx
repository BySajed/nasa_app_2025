import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

const Toast = ({
  message,
  type,
}: {
  message: string;
  type: "info" | "success" | "error";
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          key="toast"
          className="toast toast-center toast-middle"
        >
          <div className={`alert alert-${type}`}>
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
