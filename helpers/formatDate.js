import { format } from 'date-fns';

// Helper function to format date
function formatDate(dateInput) {
  try {
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      console.error('Unexpected date input type:', typeof dateInput);
      return 'Invalid Date';
    }

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return 'Invalid Date';
    }

    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateInput);
    return 'Invalid Date';
  }
}

export default formatDate;
