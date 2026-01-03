export function parseSlotDateTime(
  slotDate: string,
  slotTime: string,
): Date | null {
  try {
    // Expected:
    // slotDate = 22_12_2025
    // slotTime = 12:41 PM

    const [day, month, year] = slotDate.split('_');
    if (!day || !month || !year) return null;

    const [time, modifier] = slotTime.split(' ');
    if (!time || !modifier) return null;

    let [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        hours,
        minutes,
      ),
    );
  } catch {
    return null;
  }
}
