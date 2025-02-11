"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/use-toast"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  bio: string | null
  username: string
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    if (!id) {
      console.log("No ID provided") // Debug log
      setIsLoading(false)
      addToast({
        title: "Error",
        description: "Invalid user ID",
        variant: "destructive",
      })
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${id}`)
        if (!response.ok) {
          throw new Error("User not found")
        }
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error("Error fetching user:", error)
        addToast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [id, addToast])

  if (isLoading) {
    return <div className="text-center">Loading...</div>
  }

  if (!user) {
    return <div className="text-center">User not found</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">User Profile</h2>
      <div className="flex items-center space-x-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
          <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-semibold">{user.name}</h3>
          <p className="text-muted-foreground">@{user.username}</p>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="mt-2">{user.bio}</p>
          <Button className="mt-2">Send Friend Request</Button>
        </div>
      </div>
    </div>
  )
}