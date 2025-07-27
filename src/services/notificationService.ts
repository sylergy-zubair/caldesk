import { Notification } from 'electron';
import { CalendarEvent } from '../types/calendar';

export class NotificationService {
  private activeNotifications: Map<string, Notification> = new Map();
  private reminderTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule notifications for upcoming events
   */
  scheduleEventNotifications(events: CalendarEvent[]): void {
    // Clear existing timers
    this.clearAllTimers();

    events.forEach(event => {
      this.scheduleEventNotification(event);
    });
  }

  /**
   * Schedule notification for a single event
   */
  private scheduleEventNotification(event: CalendarEvent): void {
    if (!event.start.dateTime) return; // Skip all-day events

    const eventStart = new Date(event.start.dateTime);
    const now = new Date();

    // Schedule notifications at different intervals before the event
    const reminderTimes = [
      { minutes: 15, label: '15 minutes' },
      { minutes: 5, label: '5 minutes' },
      { minutes: 1, label: '1 minute' }
    ];

    reminderTimes.forEach(reminder => {
      const notificationTime = new Date(eventStart.getTime() - reminder.minutes * 60 * 1000);
      
      // Only schedule if the notification time is in the future
      if (notificationTime > now) {
        const timeoutMs = notificationTime.getTime() - now.getTime();
        const timerId = `${event.id}-${reminder.minutes}min`;

        const timer = setTimeout(() => {
          this.showEventNotification(event, reminder.label);
          this.reminderTimers.delete(timerId);
        }, timeoutMs);

        this.reminderTimers.set(timerId, timer);
      }
    });

    // Schedule notification for event start
    if (eventStart > now) {
      const timeoutMs = eventStart.getTime() - now.getTime();
      const timerId = `${event.id}-start`;

      const timer = setTimeout(() => {
        this.showEventStartNotification(event);
        this.reminderTimers.delete(timerId);
      }, timeoutMs);

      this.reminderTimers.set(timerId, timer);
    }
  }

  /**
   * Show reminder notification
   */
  private showEventNotification(event: CalendarEvent, timeLabel: string): void {
    if (!Notification.isSupported()) return;

    const notification = new Notification({
      title: `Event in ${timeLabel}`,
      body: `${event.summary}${event.location ? ` at ${event.location}` : ''}`,
      icon: this.getNotificationIcon(),
      urgency: 'normal',
      timeoutType: 'default',
    });

    notification.on('click', () => {
      // Focus the main window when notification is clicked
      this.focusMainWindow();
    });

    notification.show();
    this.activeNotifications.set(`${event.id}-reminder`, notification);
  }

  /**
   * Show event start notification
   */
  private showEventStartNotification(event: CalendarEvent): void {
    if (!Notification.isSupported()) return;

    const notification = new Notification({
      title: 'Event Starting Now',
      body: `${event.summary}${event.location ? ` at ${event.location}` : ''}`,
      icon: this.getNotificationIcon(),
      urgency: 'critical',
      timeoutType: 'never',
    });

    notification.on('click', () => {
      this.focusMainWindow();
    });

    notification.show();
    this.activeNotifications.set(`${event.id}-start`, notification);
  }

  /**
   * Show general notification
   */
  showNotification(title: string, body: string, urgency: 'low' | 'normal' | 'critical' = 'normal'): void {
    if (!Notification.isSupported()) return;

    const notification = new Notification({
      title,
      body,
      icon: this.getNotificationIcon(),
      urgency,
      timeoutType: 'default',
    });

    notification.on('click', () => {
      this.focusMainWindow();
    });

    notification.show();
  }

  /**
   * Clear all scheduled timers
   */
  private clearAllTimers(): void {
    this.reminderTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.reminderTimers.clear();
  }

  /**
   * Clear all active notifications
   */
  clearAllNotifications(): void {
    this.activeNotifications.forEach(notification => {
      notification.close();
    });
    this.activeNotifications.clear();
  }

  /**
   * Get notification icon path
   */
  private getNotificationIcon(): string {
    // You can add a proper icon file here
    // For now, returning empty string to use system default
    return '';
  }

  /**
   * Focus the main window
   */
  private focusMainWindow(): void {
    // This will be handled by the main process
    // We'll emit an event that the main process can listen to
  }

  /**
   * Clean up service
   */
  destroy(): void {
    this.clearAllTimers();
    this.clearAllNotifications();
  }
}

export const notificationService = new NotificationService();