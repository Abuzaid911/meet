"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AttendanceProps {
  eventId: string;
}

interface Attendance {
  isAttending: boolean;
  rsvp: "yes" | "no" | "maybe";
}

export function EventAttendance({ eventId }: AttendanceProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [attendance, setAttendance] = useState<Attendance | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (session?.user?.id) {
        const response = await fetch(`/api/events/${eventId}/attend`);
        if (response.ok) {
          const data: Attendance = await response.json();
          setAttendance(data);
        }
      }
    };

    fetchAttendance();
  }, [session, eventId]);

  const handleRSVP = async (rsvp: "yes" | "no" | "maybe") => {
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }

    const response = await fetch(`/api/events/${eventId}/attend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rsvp }),
    });

    if (response.ok) {
      const updatedAttendance: Attendance = await response.json();
      setAttendance({ isAttending: true, rsvp: updatedAttendance.rsvp });
    }
  };

  if (!attendance) {
    return <div>Loading attendance...</div>;
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
  );
}