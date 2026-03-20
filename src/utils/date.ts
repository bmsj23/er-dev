const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const detailDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function parseDate(isoString: string): Date | null {
  const parsedDate = new Date(isoString);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatEntryDate(isoString: string): string {
  const parsedDate = parseDate(isoString);
  return parsedDate ? shortDateFormatter.format(parsedDate) : 'Unknown date';
}

export function formatEntryDateTime(isoString: string): string {
  const parsedDate = parseDate(isoString);
  return parsedDate ? detailDateFormatter.format(parsedDate) : 'Unknown date';
}
