"use client"

import { useEffect, useState } from "react"
import { getProviders, signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { useToast } from "../../components/ui/use-toast"
import { Loader2 } from "lucide-react"

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

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/")
      return
    }
  }, [status, session, router])

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
          title: "Sign-In Failed",
          description: "Could not sign in. Please try again.",
          variant: "destructive",
        })
      } else if (result?.url) {
        console.log("Redirecting to:", result.url)
        router.push(result.url)
      } else {
        console.log("Unexpected result. Full response:", result)
        addToast({
          title: "Processing...",
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

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-10 h-10 text-gray-500" />
        <p className="text-gray-500 mt-3">Loading sign-in options...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Sign In</h1>

      {providers ? (
        Object.values(providers).map((provider: Provider) => (
          <div key={provider.name} className="mb-4 w-full max-w-xs">
            <Button
              onClick={() => handleSignIn(provider.id)}
              className="w-full text-lg flex justify-center"
            >
              Sign in with {provider.name}
            </Button>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No sign-in providers available</p>
      )}

      <div className="mt-6 text-sm text-gray-600 text-center max-w-sm">
        <p>If you&apos;re having trouble signing in, try these steps:</p>
        <ul className="list-disc list-inside text-gray-500 mt-2 text-left">
          <li>Ensure pop-ups are allowed for this site.</li>
          <li>Disable ad-blockers or privacy extensions.</li>
          <li>Clear your browser cache and cookies.</li>
          <li>Try using a different browser.</li>
          <li>Ensure third-party cookies are enabled.</li>
        </ul>
      </div>
    </div>
  )
}