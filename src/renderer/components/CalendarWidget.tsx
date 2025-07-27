import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCalendar } from '../hooks/useCalendar';
import UserProfile from './UserProfile';
import EventModal from './EventModal';
import WindowControls from './WindowControls';
import CalendarSettings from './CalendarSettings';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  summary: string;
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
  calendarId?: string;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface CalendarWidgetProps {
  user: GoogleUser;
  onLogout: () => Promise<void>;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ user, onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { 
    todaysEvents, 
    events, 
    calendars,
    isLoading, 
    error, 
    lastUpdated,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh 
  } = useCalendar(true);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    generateCalendar();
  }, [currentDate]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!events.length) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventDate = event.start.date || event.start.dateTime?.split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getDisplayEvents = (): CalendarEvent[] => {
    if (selectedDate) {
      return getEventsForDate(selectedDate);
    }
    return todaysEvents;
  };

  const getDisplayDateText = (): string => {
    if (!selectedDate) return "Today's Events";
    
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (isToday) return "Today's Events";
    
    const month = months[selectedDate.getMonth()];
    const day = selectedDate.getDate();
    return `${month} ${day} Events`;
  };

  const getEventColor = (event: CalendarEvent): string => {
    // First check if event has a calendarId
    if (event.calendarId) {
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      if (calendar?.backgroundColor) {
        return calendar.backgroundColor;
      }
    }
    
    // Fallback to default blue
    return '#1976d2';
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = 
        currentDay.getDate() === today.getDate() &&
        currentDay.getMonth() === today.getMonth() &&
        currentDay.getFullYear() === today.getFullYear();
      
      days.push({
        date: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        events: getEventsForDate(new Date(currentDay))
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const formatEventTime = (event: CalendarEvent): string => {
    if (event.start.date) {
      return 'All day';
    }
    
    if (event.start.dateTime) {
      const time = new Date(event.start.dateTime);
      return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    
    return '';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  useEffect(() => {
    generateCalendar();
  }, [currentDate, events]);

  const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
    const calendarId = eventData.calendarId || calendars.find(c => c.primary)?.id || 'primary';
    await createEvent(calendarId, eventData);
  };

  const handleUpdateEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!editingEvent) return;
    const calendarId = editingEvent.calendarId || 'primary';
    await updateEvent(calendarId, editingEvent.id, eventData);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    const confirmed = confirm(`Delete "${event.summary}"?`);
    if (confirmed) {
      const calendarId = event.calendarId || 'primary';
      await deleteEvent(calendarId, event.id);
    }
  };

  const openCreateEventModal = (date?: Date) => {
    setEditingEvent(null);
    setSelectedDate(date || null);
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleCalendarToggle = async (calendarId: string, enabled: boolean) => {
    // For now, we'll just refresh the events to reflect the change
    // In a more sophisticated implementation, we'd store calendar preferences
    console.log(`Calendar ${calendarId} ${enabled ? 'enabled' : 'disabled'}`);
    
    // Refresh events to reflect the calendar selection change
    setTimeout(() => {
      refresh();
    }, 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Window Controls */}
      <WindowControls />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="interactive p-2 rounded-lg hover-glass transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <motion.h2 
            key={currentDate.getMonth()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-semibold"
          >
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </motion.h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="interactive p-2 rounded-lg hover-glass transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Calendar settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="interactive p-2 rounded-lg hover-glass transition-all duration-200"
            title="Calendar settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Refresh button */}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="interactive p-2 rounded-lg hover-glass transition-all duration-200 disabled:opacity-50"
            title="Refresh calendar"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* User profile */}
          <UserProfile user={user} onLogout={onLogout} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-2 p-2 glass rounded-lg border border-red-500/20 bg-red-500/10"
        >
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Calendar */}
      <div className="flex-1 p-4">
        {/* Week days header */}
        <div className="calendar-grid mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-xs font-medium text-center py-2 text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-grid gap-1">
          {calendarDays.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.01 }}
              className={`
                relative aspect-square flex flex-col items-center justify-start p-1 rounded-lg cursor-pointer interactive
                transition-all duration-200
                ${day.isCurrentMonth 
                  ? 'text-gray-900 dark:text-gray-100 hover:bg-white/10' 
                  : 'text-gray-400 dark:text-gray-600'
                }
                ${day.isToday 
                  ? 'bg-blue-500 text-white font-bold' 
                  : ''
                }
                ${selectedDate && 
                  selectedDate.getDate() === day.date && 
                  selectedDate.getMonth() === currentDate.getMonth() && 
                  selectedDate.getFullYear() === currentDate.getFullYear() && 
                  !day.isToday
                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-semibold' 
                  : ''
                }
              `}
              onClick={() => {
                const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date);
                setSelectedDate(clickedDate);
              }}
              onDoubleClick={() => {
                const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date);
                if (day.isCurrentMonth) {
                  openCreateEventModal(clickedDate);
                }
              }}
            >
              <span className="text-xs">{day.date}</span>
              
              {/* Event indicators */}
              {day.events.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-1 w-full">
                  {day.events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="w-full h-1 rounded-full"
                      style={{ backgroundColor: `${getEventColor(event)}CC` }} // Add transparency
                      title={`${event.summary} ${formatEventTime(event)}`}
                    />
                  ))}
                  {day.events.length > 2 && (
                    <div className="text-[8px] text-center">+{day.events.length - 2}</div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Today's events */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">{getDisplayDateText()}</h3>
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          {getDisplayEvents().length > 0 ? (
            getDisplayEvents().map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="event-card flex items-center space-x-2 group cursor-pointer"
                onClick={() => openEditEventModal(event)}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getEventColor(event) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate group-hover:text-blue-400 transition-colors">
                    {event.summary}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {formatEventTime(event)}
                    {event.location && ` • ${event.location}`}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </motion.div>
            ))
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              {isLoading ? 'Loading events...' : 'No events today'}
            </p>
          )}
        </div>
      </div>

      {/* Quick add button */}
      <div className="p-4 pt-2">
        <button 
          onClick={() => openCreateEventModal(selectedDate || undefined)}
          className="interactive w-full py-2 px-4 glass-strong rounded-lg text-sm font-medium hover-glass transition-all duration-200"
        >
          + Add Event{selectedDate && !selectedDate.toDateString().includes(new Date().toDateString()) ? ` for ${months[selectedDate.getMonth()]} ${selectedDate.getDate()}` : ''}
        </button>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
        event={editingEvent}
        calendars={calendars}
        defaultDate={selectedDate || undefined}
      />

      {/* Calendar Settings Modal */}
      <CalendarSettings
        calendars={calendars}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onCalendarToggle={handleCalendarToggle}
      />
    </div>
  );
};

export default CalendarWidget;