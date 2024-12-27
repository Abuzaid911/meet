'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from "../../components/ui/use-toast"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const { addToast } = useToast()

  useEffect(() => {
    if (error) {
      addToast(`Authentication error: ${error}`, 'error')
    }
  }, [error, addToast])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Authentication Error</h1>
      <p className="text-xl mb-4">
        {error || 'An unknown error occurred during authentication.'}
      </p>
      <p className="text-lg">Please try signing in again.</p>
    </div>
  )
}

