import { google } from 'googleapis';
import { CalendarEvent, CalendarInfo, EventFilter } from '../types/calendar';
import { AuthTokens } from '../types/auth';
import { GoogleAuthService } from './googleAuth';

export class GoogleCalendarService {
  private calendar: any;
  private authService: GoogleAuthService;

  constructor(authService: GoogleAuthService) {
    this.authService = authService;
  }

  /**
   * Initialize the calendar service with authentication
   */
  initialize(tokens: AuthTokens): void {
    const auth = this.authService.getAuthenticatedClient(tokens);
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  /**
   * Get list of user's calendars
   */
  async getCalendars(): Promise<CalendarInfo[]> {
    try {
      const response = await this.calendar.calendarList.list();
      
      return response.data.items?.map((calendar: any): CalendarInfo => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor,
        primary: calendar.primary,
        selected: calendar.selected,
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch calendars: ${error}`);
    }
  }

  /**
   * Get events from calendar(s)
   */
  async getEvents(filter: EventFilter = {}): Promise<CalendarEvent[]> {
    try {
      const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        calendarIds = ['primary'],
        showDeleted = false,
        singleEvents = true,
        orderBy = 'startTime',
      } = filter;

      const allEvents: CalendarEvent[] = [];

      // Fetch events from each calendar
      for (const calendarId of calendarIds) {
        try {
          const response = await this.calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            showDeleted,
            singleEvents,
            orderBy,
            maxResults: 100,
          });

          const events = response.data.items?.map((event: any): CalendarEvent => ({
            id: event.id,
            summary: event.summary || '(No title)',
            description: event.description,
            start: {
              dateTime: event.start.dateTime,
              date: event.start.date,
              timeZone: event.start.timeZone,
            },
            end: {
              dateTime: event.end.dateTime,
              date: event.end.date,
              timeZone: event.end.timeZone,
            },
            location: event.location,
            colorId: event.colorId,
            htmlLink: event.htmlLink,
            creator: event.creator ? {
              email: event.creator.email,
              displayName: event.creator.displayName,
            } : undefined,
            attendees: event.attendees?.map((attendee: any) => ({
              email: attendee.email,
              displayName: attendee.displayName,
              responseStatus: attendee.responseStatus,
            })),
          })) || [];

          allEvents.push(...events);
        } catch (calendarError) {
          console.warn(`Failed to fetch events from calendar ${calendarId}:`, calendarError);
        }
      }

      // Sort all events by start time
      return allEvents.sort((a, b) => {
        const aStart = a.start.dateTime || a.start.date!;
        const bStart = b.start.dateTime || b.start.date!;
        return new Date(aStart).getTime() - new Date(bStart).getTime();
      });
    } catch (error) {
      throw new Error(`Failed to fetch events: ${error}`);
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(calendarId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          attendees: event.attendees,
        },
      });

      return this.transformEvent(response.data);
    } catch (error) {
      throw new Error(`Failed to create event: ${error}`);
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          attendees: event.attendees,
        },
      });

      return this.transformEvent(response.data);
    } catch (error) {
      throw new Error(`Failed to update event: ${error}`);
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      throw new Error(`Failed to delete event: ${error}`);
    }
  }

  /**
   * Get today's events
   */
  async getTodaysEvents(calendarIds?: string[]): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    return this.getEvents({
      timeMin: startOfDay,
      timeMax: endOfDay,
      calendarIds,
    });
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(calendarIds?: string[], days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    return this.getEvents({
      timeMin: now,
      timeMax: futureDate,
      calendarIds,
    });
  }

  /**
   * Transform raw Google Calendar event to our format
   */
  private transformEvent(event: any): CalendarEvent {
    return {
      id: event.id,
      summary: event.summary || '(No title)',
      description: event.description,
      start: {
        dateTime: event.start.dateTime,
        date: event.start.date,
        timeZone: event.start.timeZone,
      },
      end: {
        dateTime: event.end.dateTime,
        date: event.end.date,
        timeZone: event.end.timeZone,
      },
      location: event.location,
      colorId: event.colorId,
      htmlLink: event.htmlLink,
      creator: event.creator ? {
        email: event.creator.email,
        displayName: event.creator.displayName,
      } : undefined,
      attendees: event.attendees?.map((attendee: any) => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus,
      })),
    };
  }
}