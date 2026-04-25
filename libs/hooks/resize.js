import { useState, useEffect } from 'react'

const IsMobile = () => {
  const [mobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobileWidth = 768; // Adjust this value to define your mobile width threshold
      if (window.innerWidth <= mobileWidth) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }

    };

    handleResize(); // Initial check on component mount

    window.addEventListener('resize', handleResize); // Event listener for window resize

    return () => {
      window.removeEventListener('resize', handleResize); // Clean up the event listener
    };
  }, []);
  return { mobile }
}

export default IsMobile
