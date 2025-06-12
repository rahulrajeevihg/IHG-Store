import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show the button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scrolling
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className="flex items-center justify-center"
          aria-label="Scroll to top"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            bottom: "50px",
            right: "50px",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            zIndex: 1000,
            cursor: "pointer",
            height: "45px",
            width: "45px",
          }}
        >
          <Image
            src={"/scroll_top.svg"}
            className="h-[20px] w-[20px]"
            height={20}
            width={20}
            alt="Scroll to Top"
          ></Image>
        </motion.button>
      )}
    </>
  );
};

export default ScrollToTopButton;
