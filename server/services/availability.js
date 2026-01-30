import dayjs from 'dayjs';

function isOnLeave(profile, date) {
  if (!profile.availability?.leaveDates?.length) return false;
  const target = dayjs(date).startOf('day').valueOf();
  return profile.availability.leaveDates.some(d => dayjs(d).startOf('day').valueOf() === target);
}

export function availabilityScore(profile, job, date = new Date()) {
  // Simple heuristic: if on leave -> 0; if working day -> 1 else 0.6; add small boost for low urgency
  if (isOnLeave(profile, date)) return 0;
  const day = dayjs(date).format('ddd').toLowerCase();
  const workingDays = profile.availability?.days || [];
  const isWorkingDay = workingDays.includes(day);
  let score = isWorkingDay ? 1 : 0.6;

  if (job?.urgency === 'emergency') score -= 0.05;
  if (job?.urgency === 'low') score += 0.05;

  return Math.max(0, Math.min(1, score));
}
