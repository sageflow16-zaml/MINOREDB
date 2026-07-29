import { Notification } from './types';
import { eventBus } from './eventBus';

class NotificationService {
  private notifications: Notification[] = [];
  private maxNotifications = 100;

  constructor() {
    eventBus.onAny((event) => {
      if (event.actor === 'system' && !event.type.startsWith('MENTOR_')) {
        this.addFromEvent(event);
      }
    });
  }

  private addFromEvent(event: any) {
    const map: Record<string, Partial<Notification>> = {
      PATTERN_DETECTED: { type: 'insight', severity: 'warning', title: 'Patterns Detected', message: `${event.data.patternCount || 'New'} patterns found in your trading data` },
      BACKTEST_COMPLETED: { type: 'milestone', severity: 'success', title: 'Backtest Complete', message: `Backtest "${event.data.backtestName || ''}" has finished` },
      DAILY_BRIEF_GENERATED: { type: 'insight', severity: 'info', title: 'Daily Brief Ready', message: 'Your personalized briefing is available' },
      DOCUMENT_PROCESSED: { type: 'insight', severity: 'info', title: 'Document Analyzed', message: 'AI has finished processing your document' },
      RULE_EXTRACTED: { type: 'milestone', severity: 'success', title: 'Rules Extracted', message: 'Trading rules have been extracted from the document' },
    };
    const template = map[event.type];
    if (template) {
      this.add({ ...template, actionable: true, createdAt: new Date().toISOString(), read: false } as Notification);
    }
  }

  add(notification: Omit<Notification, 'id'>) {
    const full: Notification = { id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...notification };
    this.notifications.unshift(full);
    if (this.notifications.length > this.maxNotifications) this.notifications = this.notifications.slice(0, this.maxNotifications);
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  getUnread(): Notification[] {
    return this.notifications.filter((n) => !n.read);
  }

  markRead(id: string) {
    const n = this.notifications.find((n) => n.id === id);
    if (n) n.read = true;
  }

  markAllRead() {
    this.notifications.forEach((n) => n.read = true);
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  clear() {
    this.notifications = [];
  }
}

export const notificationService = new NotificationService();
