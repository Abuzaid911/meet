"use client"

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const media = window.matchMedia(query)
    
    // Initial check
    setMatches(media.matches)
    
    // Update matches when the media query changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    media.addEventListener('change', listener)
    
    return () => {
      media.removeEventListener('change', listener)
    }
  }, [query])
  
  return matches
} 