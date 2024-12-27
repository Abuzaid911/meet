'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'

interface Comment {
  id: string
  text: string
  user: {
    name: string
  }
}

interface CommentListProps {
  eventId: string
}

export function CommentList({ eventId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    async function fetchComments() {
      const response = await fetch(`/api/comments?eventId=${eventId}`)
      const data = await response.json()
      setComments(data)
    }
    fetchComments()
  }, [eventId])

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-2">
          <Avatar>
            <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{comment.user.name}</p>
            <p>{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

