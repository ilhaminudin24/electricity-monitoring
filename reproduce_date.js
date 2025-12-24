
const today = new Date();
today.setHours(0, 0, 0, 0); // Local time midnight

console.log("Local Today:", today.toString());

const days = 16;
const depletionDate = new Date(today);
depletionDate.setDate(today.getDate() + days);

console.log("Local Depletion Date Object:", depletionDate.toString());

// OLD LOGIC
const isoString = depletionDate.toISOString().split('T')[0];
console.log("OLD Logic Output (UTC):", isoString);

// NEW LOGIC
const formatLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const newString = formatLocalDate(depletionDate);
console.log("NEW Logic Output (Local):", newString);

if (newString !== isoString) {
    console.log("SUCCESS: New logic differs from old logic (and should match local date).");
} else {
    console.log("WARNING: New logic matches old logic (might be same day in UTC, or issue persists, or testing at different time).");
}
