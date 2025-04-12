'use client';

import {
  Card,
  CardContent,
} from "../ui/card";
import {
  CalendarRange,
  Clock,
  Users
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface OverviewStatsProps {
  eventsCount: number;
  friendsCount: number;
  isLoadingEvents: boolean;
  isLoadingFriends: boolean;
  joinedDate: string;
}

export function OverviewStats({
  eventsCount,
  friendsCount,
  isLoadingEvents,
  isLoadingFriends,
  joinedDate
}: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="bg-secondary/50">
        <CardContent className="p-4 flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarRange className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Events Hosted/Attending</p>
            <p className="font-semibold text-lg">{isLoadingEvents ? '...' : eventsCount}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-secondary/50">
        <CardContent className="p-4 flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Friends</p>
            <p className="font-semibold text-lg">{isLoadingFriends ? '...' : friendsCount}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-secondary/50">
        <CardContent className="p-4 flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="font-semibold text-lg">{format(parseISO(joinedDate), 'MMM yyyy')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 