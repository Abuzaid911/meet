'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from './ui/button'
import { Loader2, LogIn } from 'lucide-react'

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button 
        disabled 
        size="sm" 
        variant="ghost"
        className="gap-2 h-9"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="sr-only">Loading...</span>
      </Button>
    )
  }

  if (session) {
    return (
      <button 
        data-auth-button
        className="hidden" // Hidden button that's targeted by other components
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        Sign out
      </button>
    )
  }

  return (
    <Button 
      onClick={() => signIn()}
      size="sm"
      className="gap-2 h-9"
      data-auth-button
    >
      <LogIn className="h-4 w-4" />
      Sign in
    </Button>
  )
}