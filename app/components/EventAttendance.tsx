"use client"

import React from "react"
import { use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AttendanceProps {
  eventId: Promise<string>
}

export function EventAttendance({ eventId }: AttendanceProps) {
  const resolvedEventId = use(eventId)
  const { data: session } = useSession()
  const router = useRouter()

  const [attendance, setAttendance] = React.useState<{ isAttending: boolean; rsvp: string | null } | null>(null)

  React.useEffect(() => {
    const fetchAttendance = async () => {
      if (session?.user?.id) {
        const response = await fetch(`/api/events/${resolvedEventId}/attend`)
        if (response.ok) {
          const data = await response.json()
          setAttendance(data)
        }
      }
    }

    fetchAttendance()
  }, [session, resolvedEventId])

  const handleRSVP = async (rsvp: "yes" | "no" | "maybe") => {
    if (!session?.user?.id) {
      router.push("/auth/signin")
      return
    }

    const response = await fetch(`/api/events/${resolvedEventId}/attend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rsvp }),
    })

    if (response.ok) {
      const updatedAttendance = await response.json()
      setAttendance({ isAttending: true, rsvp: updatedAttendance.rsvp })
    }
  }

  if (!attendance) {
    return <div>Loading attendance...</div>
  }

  return (
    <div>
      <h3>Your RSVP</h3>
      <p>Status: {attendance.isAttending ? attendance.rsvp : "Not attending"}</p>
      <div>
        <button onClick={() => handleRSVP("yes")} disabled={attendance.rsvp === "yes"}>
          Yes
        </button>
        <button onClick={() => handleRSVP("no")} disabled={attendance.rsvp === "no"}>
          No
        </button>
        <button onClick={() => handleRSVP("maybe")} disabled={attendance.rsvp === "maybe"}>
          Maybe
        </button>
      </div>
    </div>
  )
}

