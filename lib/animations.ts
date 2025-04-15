"use client"

/**
 * Animation utility constants for reuse across the application
 * Defines animation variants for Framer Motion transitions
 */

/**
 * Fades in an element from invisible to visible with a slight upward movement
 */
export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

/**
 * Simple fade in with no movement
 */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.5 
    } 
  }
}

/**
 * Fade in with slight downward movement
 */
export const slideIn = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5 
    } 
  }
}

/**
 * Scale in from slightly smaller size
 */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "backOut"
    }
  }
}

/**
 * Container for staggered children animations
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    }
  }
}

/**
 * Slide in from the right
 */
export const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5, 
      ease: "easeOut"
    }
  }
}

/**
 * Slide in from the left
 */
export const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5, 
      ease: "easeOut"
    }
  }
}

/**
 * Pulse animation for hover states
 */
export const pulse = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      yoyo: Infinity
    }
  }
}

/**
 * Transition settings for smooth animations
 */
export const smoothTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20
} 