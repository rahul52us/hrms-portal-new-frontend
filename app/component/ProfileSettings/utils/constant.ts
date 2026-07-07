const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]
export const getDefaultSchedule = () => {
  return DAYS_OF_WEEK.map((day) => ({
    day,
    isOpen: day !== 'Sunday', // Example: Default Sunday to closed
    slots: [{ start: '09:00', end: '17:00' }], 
  }))
}