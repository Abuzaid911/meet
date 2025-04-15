import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { CalendarIcon, Users } from 'lucide-react'
import { format, isPast, addDays, isBefore } from 'date-fns'
import { motion } from 'framer-motion'
import { Badge } from '../components/ui/badge'

interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  description?: string
  headerImageUrl?: string
  headerColor?: string
  host: {
    id: string
    name: string
    image: string | null
  }
  attendees: {
    user: {
      id: string
      name: string
      image: string | null
    }
    rsvp: string
  }[]
}

interface EventFeedProps {
  events?: Event[]
  searchTerm?: string
  filter?: string
}

export function EventFeed({ events = [], searchTerm = "" }: EventFeedProps) {
  if (!events || events.length === 0) {
    return (
      <Card className="border border-gray-200 bg-white text-center p-8 rounded-xl">
        <CardContent>
          <CalendarIcon className="mx-auto mb-4 h-8 w-8 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700">No events found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm ? `No events matching "${searchTerm}"` : "Start by creating or joining an event."}
          </p>
        </CardContent>
      </Card>
    )
  }

  const isEventSoon = (date: string) => {
    const eventDate = new Date(date)
    const now = new Date()
    return !isPast(eventDate) && isBefore(eventDate, addDays(now, 3))
  }

  const isEventPopular = (attendees: Event['attendees']) => {
    return attendees.filter(a => a.rsvp === 'YES').length >= 8
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, i) => {
        const formattedDate = format(new Date(event.date), 'MMM dd').toUpperCase()
        const soon = isEventSoon(event.date)
        const popular = isEventPopular(event.attendees)
        const attendeeCount = event.attendees.filter(a => a.rsvp === 'YES').length

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/events/${event.id}`} className="block h-full">
              <div className="bg-white border border-gray-200 rounded-xl h-full shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                {/* Header */}
                <div className="relative h-32 w-full overflow-hidden">
                  {event.headerImageUrl ? (
                    <Image
                      src={event.headerImageUrl}
                      alt={event.name}
                      fill
                      className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={i < 3}
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: event.headerColor || '#e2e8f0' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between p-5 flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-600">
                        {formattedDate}
                      </span>
                      <div className="flex gap-1">
                        {soon && (
                          <Badge className="bg-blue-100 text-blue-700 px-2 py-0.5 text-xs rounded-full">
                            Soon
                          </Badge>
                        )}
                        {popular && (
                          <Badge className="bg-purple-100 text-purple-700 px-2 py-0.5 text-xs rounded-full">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{event.name}</h3>
                    <p className="text-gray-600 text-sm mb-1 line-clamp-1">{event.location}</p>
                    {event.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{event.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
                    <div className="flex items-center gap-2 mt-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={event.host.image || undefined} />
                        <AvatarFallback>{event.host.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-800">{event.host.name}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 mt-3">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{attendeeCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}