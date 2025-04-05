'use client';

import { Button } from "./ui/button";
import { CalendarPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";


interface AddToCalendarButtonProps {
  event: {
    name: string;
    description?: string;
    date: string | Date;
    time: string;
    duration: number;
    location: string;
  };
  className?: string;
  timezone?: string; // NEW
}

// Format Date to YYYY-MM-DD
const formatDateToString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function AddToCalendarButton({
  event,
  className,
  timezone = 'UTC', // Default
}: AddToCalendarButtonProps) {
  const parsedDate = new Date(event.date);
  const eventDateString = formatDateToString(parsedDate);

  const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(eventDateString);
  const isValidTimeFormat = /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time);

  if (!isValidDateFormat || !isValidTimeFormat) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        disabled
        title={`Expected date: YYYY-MM-DD, time: HH:mm`}
      >
        <CalendarPlus className="mr-2 h-4 w-4" />
        Invalid Format
      </Button>
    );
  }

  const startDate = new Date(`${eventDateString}T${event.time}`);
  const endDate = new Date(startDate.getTime() + (event.duration || 0) * 60000);

  const formatDateForGoogle = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d+/g, '');

  const formatDateForOutlook = (date: Date) =>
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const googleUrl = () => {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.name,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
      details: event.description || '',
      location: event.location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const outlookUrl = () => {
    const params = new URLSearchParams({
      subject: event.name,
      startdt: formatDateForOutlook(startDate),
      enddt: formatDateForOutlook(endDate),
      body: event.description || '',
      location: event.location,
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatForTZID = (date: Date) => {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  };

  const generateICalContent = () => {
    const start = formatForTZID(startDate);
    const end = formatForTZID(endDate);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourApp//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${event.name}`,
      `DTSTART;TZID=${timezone}:${start}`,
      `DTEND;TZID=${timezone}:${end}`,
      `LOCATION:${event.location}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleICalDownload = (e: Event) => {
    e.preventDefault();
    const content = generateICalContent();
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.name.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleUrl()} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={outlookUrl()} target="_blank" rel="noopener noreferrer">
            Outlook Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => handleICalDownload(e as unknown as Event)}>
          Download iCal (.ics) – Apple Calendar Friendly
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}