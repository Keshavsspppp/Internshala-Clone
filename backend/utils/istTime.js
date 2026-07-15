const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const toShiftedISTDate = (date = new Date()) =>
  new Date(date.getTime() + IST_OFFSET_MS);

const getISTParts = (date = new Date()) => {
  const shifted = toShiftedISTDate(date);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
};

const isWithinISTHourWindow = (startHour, endHour, date = new Date()) => {
  const { hour } = getISTParts(date);
  return hour >= startHour && hour < endHour;
};

const getStartOfISTDayUTC = (date = new Date()) => {
  const { year, month, day } = getISTParts(date);
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
};

const getStartOfISTMonthUTC = (date = new Date()) => {
  const { year, month } = getISTParts(date);
  return new Date(Date.UTC(year, month, 1) - IST_OFFSET_MS);
};

const getEndOfISTDayUTC = (date = new Date()) =>
  new Date(getStartOfISTDayUTC(date).getTime() + 24 * 60 * 60 * 1000);

const getEndOfISTMonthUTC = (date = new Date()) => {
  const { year, month } = getISTParts(date);
  return new Date(Date.UTC(year, month + 1, 1) - IST_OFFSET_MS);
};

const getISTDateKey = (date = new Date()) => {
  const { year, month, day } = getISTParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

module.exports = {
  getISTDateKey,
  getISTParts,
  getEndOfISTDayUTC,
  getEndOfISTMonthUTC,
  getStartOfISTDayUTC,
  getStartOfISTMonthUTC,
  isWithinISTHourWindow,
};
