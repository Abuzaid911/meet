'use client'

import { createAuthClient } from 'better-auth/react'
import { Button } from './ui/button'
import { Loader2, LogIn } from 'lucide-react'

const { useSession, signIn, signOut } = createAuthClient()

export function AuthButton() {
  const { data: session, isPending: status } = useSession()

  if (status === true) {
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
        onClick={() => signOut()}
      >
        Sign out
      </button>
    )
  }

  return (
    <Button 
      onClick={() => signIn.social({ provider: 'google' })}
      size="sm"
      className="gap-2 h-9"
      data-auth-button
    >
      <LogIn className="h-4 w-4" />
      Sign in
    </Button>
  )
}