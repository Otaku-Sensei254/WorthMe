const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const recurringMonthlyEquivalent = (item) => {
  const amount = Number(item.amount || 0);
  if (item.frequency === "daily") return amount * 365 / 12;
  if (item.frequency === "weekly") return amount * 52 / 12;
  if (item.frequency === "yearly") return amount / 12;
  return amount;
};

export const recurringScheduleLabel = (item) => {
  if (item.frequency === "daily") return "Daily";
  if (item.frequency === "weekly") return `Weekly · ${weekdays[Number(item.due_weekday)]}`;
  if (item.frequency === "yearly") return `Yearly · ${months[Number(item.due_month) - 1]} ${item.due_day}`;
  return `Monthly · Day ${item.due_day}`;
};
