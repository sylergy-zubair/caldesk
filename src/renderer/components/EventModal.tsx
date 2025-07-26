import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '../../types/calendar';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => Promise<void>;
  event?: CalendarEvent | null;
  calendars: Array<{ id: string; summary: string; backgroundColor?: string }>;
  defaultDate?: Date;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  calendars,
  defaultDate
}) => {
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    calendarId: 'primary',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isAllDay: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode - populate with existing event data
        const startDateTime = event.start.dateTime || event.start.date;
        const endDateTime = event.end.dateTime || event.end.date;
        
        if (startDateTime) {
          const start = new Date(startDateTime);
          const end = new Date(endDateTime!);
          
          setFormData({
            summary: event.summary || '',
            description: event.description || '',
            location: event.location || '',
            calendarId: 'primary', // We'd need to track this from the event
            startDate: start.toISOString().split('T')[0],
            startTime: event.start.dateTime ? start.toTimeString().slice(0, 5) : '',
            endDate: end.toISOString().split('T')[0],
            endTime: event.end.dateTime ? end.toTimeString().slice(0, 5) : '',
            isAllDay: !event.start.dateTime,
          });
        }
      } else {
        // Create mode - use defaults
        const today = defaultDate || new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + (today.getHours() >= 22 ? 1 : 0));
        
        const startHour = today.getHours() >= 22 ? 9 : today.getHours() + 1;
        const endHour = startHour + 1;
        
        setFormData({
          summary: '',
          description: '',
          location: '',
          calendarId: calendars.find(c => c.id === 'primary')?.id || calendars[0]?.id || 'primary',
          startDate: tomorrow.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endDate: tomorrow.toISOString().split('T')[0],
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          isAllDay: false,
        });
      }
      setError(null);
    }
  }, [isOpen, event, defaultDate, calendars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const eventData: Partial<CalendarEvent> = {
        summary: formData.summary.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        calendarId: formData.calendarId,
      };

      if (formData.isAllDay) {
        eventData.start = { date: formData.startDate };
        eventData.end = { date: formData.endDate };
      } else {
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
        
        eventData.start = { dateTime: startDateTime.toISOString() };
        eventData.end = { dateTime: endDateTime.toISOString() };
      }

      await onSave(eventData);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-strong rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {event ? 'Edit Event' : 'Create Event'}
              </h2>
              <button
                onClick={onClose}
                className="interactive p-1 rounded-lg hover-glass"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 glass rounded-lg border border-red-500/20 bg-red-500/10"
              >
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.summary}
                  onChange={handleInputChange('summary')}
                  className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none"
                  placeholder="Event title"
                  required
                />
              </div>

              {/* Calendar Selection */}
              {calendars.length > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Calendar</label>
                  <select
                    value={formData.calendarId}
                    onChange={handleInputChange('calendarId')}
                    className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none"
                  >
                    {calendars.map(calendar => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.summary}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* All Day Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.isAllDay}
                  onChange={handleInputChange('isAllDay')}
                  className="rounded border-white/20"
                />
                <label htmlFor="allDay" className="text-sm">All day</label>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange('startDate')}
                    className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange('endDate')}
                    className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {!formData.isAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange('startTime')}
                      className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange('endTime')}
                      className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none"
                  placeholder="Event location"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  rows={3}
                  className="w-full p-2 glass rounded-lg border border-white/10 bg-white/5 focus:border-blue-500/50 focus:outline-none resize-none"
                  placeholder="Event description"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 glass rounded-lg border border-white/20 hover-glass transition-all duration-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-500 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading || !formData.summary.trim()}
                >
                  {isLoading ? 'Saving...' : (event ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventModal;