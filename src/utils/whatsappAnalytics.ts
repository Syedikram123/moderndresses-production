import type { WhatsAppClickEvent } from '../types';
import { doc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

export type { WhatsAppClickEvent };

export const WHATSAPP_CLICKS_STORAGE_KEY = 'modern_dresses_whatsapp_clicks';

/**
 * Retrieve all WhatsApp click events from LocalStorage and sync from Firestore if available
 */
export function getWhatsAppClicks(): WhatsAppClickEvent[] {
  try {
    const raw = localStorage.getItem(WHATSAPP_CLICKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read WhatsApp clicks from LocalStorage:', err);
    return [];
  }
}

/**
 * Asynchronously sync clicks from Firestore into LocalStorage cache
 */
export async function syncWhatsAppClicksFromFirestore(): Promise<WhatsAppClickEvent[]> {
  if (!isFirebaseConfigured || !db) return getWhatsAppClicks();

  try {
    const q = query(collection(db, 'whatsapp_clicks'), orderBy('timestamp', 'desc'), limit(500));
    const snap = await getDocs(q);
    const list: WhatsAppClickEvent[] = [];
    snap.forEach((d) => {
      list.push(d.data() as WhatsAppClickEvent);
    });

    if (list.length > 0) {
      localStorage.setItem(WHATSAPP_CLICKS_STORAGE_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Firestore sync WhatsApp clicks error:', err);
  }

  return getWhatsAppClicks();
}

/**
 * Record a new WhatsApp click event locally into LocalStorage and persist to Firestore
 */
export function recordWhatsAppClick(data: {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
}): WhatsAppClickEvent {
  const newEvent: WhatsAppClickEvent = {
    id: `wac-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    productId: data.productId,
    productName: data.productName,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    subcategoryId: data.subcategoryId,
    subcategoryName: data.subcategoryName,
    timestamp: new Date().toISOString(),
  };

  try {
    const clicks = getWhatsAppClicks();
    clicks.unshift(newEvent);
    localStorage.setItem(WHATSAPP_CLICKS_STORAGE_KEY, JSON.stringify(clicks));

    // Persist to Firestore asynchronously
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'whatsapp_clicks', newEvent.id), newEvent).catch((err) => {
        console.warn('Could not save WhatsApp click to Firestore:', err);
      });
    }

    return newEvent;
  } catch (err) {
    console.error('Failed to save WhatsApp click event:', err);
    return newEvent;
  }
}

/**
 * Calculate the total number of WhatsApp clicks recorded on the current calendar date
 */
export function getTodayWhatsAppClicksCount(): number {
  const clicks = getWhatsAppClicks();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  return clicks.filter((c) => {
    const t = new Date(c.timestamp).getTime();
    return t >= startOfToday && t <= endOfToday;
  }).length;
}

/**
 * Format timestamp into display format: "22 Sep 2026, 2:35 PM"
 */
export function formatClickDate(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Date filtering helper matching the specified date filter options
 */
export type DateFilterOption = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thismonth' | 'custom';

export function isTimestampInDateRange(
  timestamp: string,
  filter: DateFilterOption,
  customDate?: string // YYYY-MM-DD
): boolean {
  const clickTime = new Date(timestamp).getTime();
  if (isNaN(clickTime)) return false;

  const now = new Date();

  switch (filter) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return clickTime >= start && clickTime <= end;
    }
    case 'yesterday': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();
      return clickTime >= start && clickTime <= end;
    }
    case 'last7days': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return clickTime >= start && clickTime <= end;
    }
    case 'last30days': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return clickTime >= start && clickTime <= end;
    }
    case 'thismonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return clickTime >= start && clickTime <= end;
    }
    case 'custom': {
      if (!customDate) return true;
      const parts = customDate.split('-');
      if (parts.length !== 3) return true;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const start = new Date(year, month, day, 0, 0, 0, 0).getTime();
      const end = new Date(year, month, day, 23, 59, 59, 999).getTime();
      return clickTime >= start && clickTime <= end;
    }
    default:
      return true;
  }
}
