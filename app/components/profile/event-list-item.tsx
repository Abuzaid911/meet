'use client';

import Link from "next/link";
import {
  Card,
} from "../ui/card";
import {
  Calendar,
  CalendarRange,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface EventProps {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
}

export function EventListItem({ id, name, date, time, location, description }: EventProps) {
  return (
    <Link href={`/events/${id}`} className="block hover:bg-muted/50 transition-colors rounded-lg">
      <Card className="flex items-start space-x-4 p-4 border shadow-sm hover:shadow-md">
        {/* Event Icon */}
        <div className="p-2 bg-primary/10 rounded-lg mt-1">
          <CalendarRange className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 space-y-1">
          <p className="font-semibold text-base leading-tight">{name}</p>
          <div className="text-xs text-muted-foreground flex items-center space-x-3 flex-wrap">
            <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {format(parseISO(date), 'PP')}</span>
            <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {time}</span>
            <span className="flex items-center"><MapPin className="mr-1 h-3 w-3" /> {location}</span>
          </div>
          {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
      </Card>
    </Link>
  );
} 