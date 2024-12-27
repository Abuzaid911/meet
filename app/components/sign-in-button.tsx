'use client'

import { signIn } from "next-auth/react"
import { Button } from "@/app/components/ui/button"

interface SignInButtonProps {
  provider: {
    id: string
    name: string
  }
}

export function SignInButton({ provider }: SignInButtonProps) {
  return (
    <Button
      onClick={() => signIn(provider.id, { callbackUrl: '/' })}
    >
      Sign in with {provider.name}
    </Button>
  )
}

