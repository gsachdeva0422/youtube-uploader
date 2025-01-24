function parseScheduleInterval(interval) {
  const regex = /(\d+)([dhm])/g;
  const parts = {};
  let match;

  while ((match = regex.exec(interval)) !== null) {
    const [_, value, unit] = match;
    parts[unit] = parseInt(value);
  }

  return {
    days: parts.d || 0,
    hours: parts.h || 0,
    minutes: parts.m || 0,
  };
}

function generateScheduleTimes(baseTime, interval) {
  const nextTime = new Date(baseTime);
  nextTime.setDate(nextTime.getDate() + interval.days);
  nextTime.setHours(nextTime.getHours() + interval.hours);
  nextTime.setMinutes(nextTime.getMinutes() + interval.minutes);
  return nextTime;
}

module.exports = {
  parseScheduleInterval,
  generateScheduleTimes,
};
