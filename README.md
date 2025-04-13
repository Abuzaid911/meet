# MeetOn - Event Management Platform

A modern, animated event management platform built with Next.js, React, TypeScript, and Framer Motion.

## Features

- **EventCarousel**: Animated carousel component for displaying upcoming events with smooth sliding transitions
- **Real-time RSVPs**: Track event attendance with instant updates
- **User Authentication**: Secure login and registration system
- **Animated UI**: Modern, engaging user interface with Framer Motion animations
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Key Components

### EventCarousel

The EventCarousel component provides a smooth, animated display of upcoming events. It features:

- Horizontal scrolling with drag gestures
- Auto-play functionality that pauses on hover/touch
- Animated transitions between event cards
- Filtering by timeframe (all, this week, this month)
- Search functionality
- Responsive design that adapts to different viewport sizes

### Implementation Details

```tsx
// Usage example in a page:
import { EventCarousel } from "./components/event-carousel"

// Basic implementation
<EventCarousel />

// With search and filter props
<EventCarousel searchTerm={searchTerm} filter={filter} />
```

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Type-safe JavaScript
- **Framer Motion**: Animation library for React
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable UI components

## Project Structure

- `app/` - Next.js app router structure
  - `components/` - Reusable UI components
    - `event-carousel.tsx` - Main carousel component
    - `ui/` - Basic UI components from shadcn/ui
  - `page.tsx` - Main home page
  - `layout.tsx` - Root layout component

## Animation Features

The project uses Framer Motion to create smooth, engaging animations:

- Staggered reveal animations for content sections
- Slide and fade animations for carousel items
- Hover effects for interactive elements
- Animated background elements
- Scroll-based animations

## Authentication

The application uses NextAuth.js for authentication, allowing users to securely:

- Create an account
- Log in with email/password
- Create and manage events
