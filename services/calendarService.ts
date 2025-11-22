import { CalendarEvent } from "../types";

// In a production environment, this would interface with the Google Calendar API
// using gapi.client.calendar.events.list and managing OAuth tokens.
// For this MVP, we simulate the integration to provide immediate functional value.

export const connectToGoogleCalendar = async (): Promise<boolean> => {
  // Simulate OAuth popup and consent delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1500);
  });
};

export const fetchCalendarEvents = async (date: Date): Promise<CalendarEvent[]> => {
  // Simulate Network Latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const startOfDay = new Date(date);
  startOfDay.setHours(9, 0, 0, 0);

  // Helper to create times relative to the start of the day
  const getTime = (hourOffset: number, minuteOffset: number = 0) => {
    const d = new Date(startOfDay);
    d.setHours(startOfDay.getHours() + hourOffset, minuteOffset);
    return d;
  };

  // Generate different schedules based on the day of the week
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

  if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend Schedule
      return [
          { id: 'w1', title: 'Morning Run', start: getTime(0), end: getTime(1) },
          { id: 'w2', title: 'Brunch with Family', start: getTime(2), end: getTime(4) },
          { id: 'w3', title: 'Grocery Shopping', start: getTime(5), end: getTime(6) },
          { id: 'w4', title: 'Relaxation & Reading', start: getTime(7), end: getTime(9) },
      ];
  }

  // Weekday Schedule
  return [
    { id: '1', title: 'Team Standup', start: getTime(0), end: getTime(0, 30) }, // 9:00 - 9:30
    { id: '2', title: 'Deep Work: Product Strategy', start: getTime(1), end: getTime(3) }, // 10:00 - 12:00
    { id: '3', title: 'Lunch Break', start: getTime(3, 30), end: getTime(4, 30) }, // 12:30 - 13:30
    { id: '4', title: 'Client Sync', start: getTime(5), end: getTime(6) }, // 14:00 - 15:00
    { id: '5', title: 'Wrap up & Planning', start: getTime(7, 30), end: getTime(8) } // 16:30 - 17:00
  ];
};

export const formatEventsForPrompt = (events: CalendarEvent[]): string => {
    if (events.length === 0) return "No events scheduled for this day.";
    
    return events.map(e => {
        const timeStr = new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${timeStr} - ${e.title}`;
    }).join('\n');
};