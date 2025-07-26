import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

interface Event {
  id: string;
  title: string;
  time: string;
  color: string;
}

const CalendarWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock events for demo
  const mockEvents: Event[] = [
    { id: '1', title: 'Team Meeting', time: '10:00 AM', color: 'bg-blue-500' },
    { id: '2', title: 'Lunch Break', time: '12:30 PM', color: 'bg-green-500' },
    { id: '3', title: 'Code Review', time: '3:00 PM', color: 'bg-purple-500' },
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    generateCalendar();
  }, [currentDate]);

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
        events: isToday ? mockEvents : []
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
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
              `}
              onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date))}
            >
              <span className="text-xs">{day.date}</span>
              
              {/* Event indicators */}
              {day.events.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-1 w-full">
                  {day.events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="w-full h-1 bg-white/80 rounded-full"
                      title={`${event.title} at ${event.time}`}
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
        <h3 className="text-sm font-medium mb-2">Today's Events</h3>
        <div className="space-y-2 max-h-20 overflow-y-auto">
          {mockEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="event-card flex items-center space-x-2"
            >
              <div className={`w-2 h-2 rounded-full ${event.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{event.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{event.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick add button */}
      <div className="p-4 pt-2">
        <button className="interactive w-full py-2 px-4 glass-strong rounded-lg text-sm font-medium hover-glass transition-all duration-200">
          + Add Event
        </button>
      </div>
    </div>
  );
};

export default CalendarWidget;