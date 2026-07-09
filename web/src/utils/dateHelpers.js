import { format } from 'date-fns';

export function formatDisplayDate(date) {
  return format(date instanceof Date ? date : new Date(date), 'PPp');
}
