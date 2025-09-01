// Simple date formatting utility to avoid external dependencies
export const format = (date: Date, formatString: string): string => {
  const map: Record<string, string> = {
    'PPP': date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    'PP': date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    'P': date.toLocaleDateString('en-US'),
    'yyyy-MM-dd': date.toISOString().split('T')[0],
    'HH:mm': date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }),
    'HH:mm:ss': date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })
  };

  return map[formatString] || date.toISOString();
};