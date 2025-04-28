
import * as React from "react"

const MOBILE_BREAKPOINT = 768 // This matches Tailwind's md breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkMobile()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return !!isMobile
}

export const useMediaQuery = useIsMobile;
