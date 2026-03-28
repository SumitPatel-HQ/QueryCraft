"use client";

import { motion } from "framer-motion";


interface AnimatedScrollButtonProps {
  onClick?: () => void;
}

export function AnimatedScrollButton({ onClick }: AnimatedScrollButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default scroll behavior
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className="group relative flex items-center justify-center "
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Scroll down"
    >
     

      {/* Inner icon */}
      

      {/* Mouse scroll indicator */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 ">
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1"
          initial={false}
        >
          <motion.div
            className="w-1 h-2 bg-purple-500 rounded-full"
            animate={{
              y: [0, 12, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </motion.button>
  );
}
