import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  htmlLink?: string;
}

interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  selected?: boolean;
}

interface EventFilter {
  timeMin?: string;
  timeMax?: string;
  calendarIds?: string[];
  showDeleted?: boolean;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
}

interface CalendarState {
  events: CalendarEvent[];
  todaysEvents: CalendarEvent[];
  calendars: CalendarInfo[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useCalendar = (isAuthenticated: boolean) => {
  const [calendarState, setCalendarState] = useState<CalendarState>({
    events: [],
    todaysEvents: [],
    calendars: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Auto-refresh events every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial load
    loadTodaysEvents();
    loadCalendars();

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadTodaysEvents();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadCalendars = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setCalendarState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const calendars = await window.electronAPI.googleCalendar.getCalendars();
      
      setCalendarState(prev => ({
        ...prev,
        calendars,
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Failed to load calendars:', error);
      setCalendarState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load calendars',
      }));
    }
  }, [isAuthenticated]);

  const loadEvents = useCallback(async (filter?: EventFilter) => {
    if (!isAuthenticated) return;

    try {
      setCalendarState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const events = await window.electronAPI.googleCalendar.getEvents(filter);
      
      setCalendarState(prev => ({
        ...prev,
        events,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      return events;
    } catch (error) {
      console.error('Failed to load events:', error);
      setCalendarState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load events',
      }));
      throw error;
    }
  }, [isAuthenticated]);

  const loadTodaysEvents = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const todaysEvents = await window.electronAPI.googleCalendar.getTodaysEvents();
      
      setCalendarState(prev => ({
        ...prev,
        todaysEvents,
        lastUpdated: new Date(),
      }));

      return todaysEvents;
    } catch (error) {
      console.error('Failed to load today\'s events:', error);
      setCalendarState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load today\'s events',
      }));
    }
  }, [isAuthenticated]);

  const createEvent = useCallback(async (calendarId: string, eventData: Partial<CalendarEvent>) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      setCalendarState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const newEvent = await window.electronAPI.googleCalendar.createEvent(calendarId, eventData);
      
      // Refresh today's events after creating
      await loadTodaysEvents();
      
      setCalendarState(prev => ({ ...prev, isLoading: false }));
      
      return newEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      setCalendarState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create event',
      }));
      throw error;
    }
  }, [isAuthenticated, loadTodaysEvents]);

  const updateEvent = useCallback(async (calendarId: string, eventId: string, eventData: Partial<CalendarEvent>) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      setCalendarState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updatedEvent = await window.electronAPI.googleCalendar.updateEvent(calendarId, eventId, eventData);
      
      // Refresh today's events after updating
      await loadTodaysEvents();
      
      setCalendarState(prev => ({ ...prev, isLoading: false }));
      
      return updatedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      setCalendarState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update event',
      }));
      throw error;
    }
  }, [isAuthenticated, loadTodaysEvents]);

  const deleteEvent = useCallback(async (calendarId: string, eventId: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      setCalendarState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await window.electronAPI.googleCalendar.deleteEvent(calendarId, eventId);
      
      // Refresh today's events after deleting
      await loadTodaysEvents();
      
      setCalendarState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Failed to delete event:', error);
      setCalendarState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete event',
      }));
      throw error;
    }
  }, [isAuthenticated, loadTodaysEvents]);

  const clearError = useCallback(() => {
    setCalendarState(prev => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadTodaysEvents(),
      loadCalendars(),
    ]);
  }, [loadTodaysEvents, loadCalendars]);

  return {
    ...calendarState,
    loadEvents,
    loadTodaysEvents,
    loadCalendars,
    createEvent,
    updateEvent,
    deleteEvent,
    clearError,
    refresh,
  };
};