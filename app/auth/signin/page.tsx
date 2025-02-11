"use client"

import { useEffect, useState } from "react"
import { getProviders, signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { useToast } from "../../components/ui/use-toast"

type Provider = {
  id: string
  name: string
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const { addToast } = useToast()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [signInAttempted, setSignInAttempted] = useState(false)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log("Fetching providers...")
        const fetchedProviders = await getProviders()
        console.log("Fetched providers:", fetchedProviders)
        setProviders(fetchedProviders)
      } catch (error) {
        console.error("Error fetching providers:", error)
        addToast({
          title: "Error",
          description: "Failed to load sign-in options. Please try again later.",
          variant: "destructive",
        })
      }
    }
    fetchProviders()
  }, [addToast])

  useEffect(() => {
    console.log("Session status:", status)
    console.log("Session data:", session)
    if (status === "authenticated" && signInAttempted) {
      console.log("User authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router, signInAttempted, session])

  const handleSignIn = async (providerId: string) => {
    setSignInAttempted(true)
    try {
      console.log("Attempting sign in with provider:", providerId)
      const result = await signIn(providerId, { callbackUrl: "/", redirect: false })
      console.log("Sign in result:", result)

      if (result?.error) {
        console.error("Sign-in error:", result.error)
        addToast({
          title: "Error",
          description: `Failed to sign in: ${result.error}`,
          variant: "destructive",
        })
      } else if (result?.url) {
        console.log("Redirecting to:", result.url)
        router.push(result.url)
      } else {
        console.log("No error or URL in result. Full result:", result)
        addToast({
          title: "Info",
          description: "Sign-in process started. Please wait...",
        })
      }
    } catch (error) {
      console.error("Unexpected sign-in error:", error)
      addToast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    }
  }

  if (status === "loading" || !providers) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Sign In</h1>
      {Object.values(providers).map((provider: Provider) => (
        <div key={provider.name} className="mb-4">
          <Button onClick={() => handleSignIn(provider.id)}>Sign in with {provider.name}</Button>
        </div>
      ))}
      <div className="mt-4 text-sm text-gray-500">
        <p>If you&apos;re having trouble signing in, please try the following:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Ensure you&apos;ve allowed pop-ups for this site</li>
          <li>Disable any ad-blockers or privacy extensions</li>
          <li>Clear your browser cache and cookies</li>
          <li>Try using a different browser</li>
          <li>Ensure you&apos;re not blocking third-party cookies</li>
        </ul>
      </div>
    </div>
  )
}

