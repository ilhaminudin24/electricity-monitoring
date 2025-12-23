/**
 * Converts an array of objects to CSV format and triggers a download.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file to download (without .csv extension)
 * @param {Array} headers - Array of objects defining headers: { key: 'property', label: 'Column Name' }
 */
export const downloadCSV = (data, filename = 'export', headers) => {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    // If no headers provided, generate from first object keys
    const cols = headers || Object.keys(data[0]).map(key => ({ key, label: key }));

    // Create CSV header row
    const headerRow = cols.map(col => `"${col.label}"`).join(',');

    // Create CSV data rows
    const rows = data.map(row => {
        return cols.map(col => {
            // Get value, handle nested properties if key contains dot
            const val = col.key.split('.').reduce((obj, k) => (obj || {})[k], row);

            // Format value for CSV
            if (val === null || val === undefined) return '""';

            const stringVal = String(val);
            // Escape double quotes and wrap in quotes
            return `"${stringVal.replace(/"/g, '""')}"`;
        }).join(',');
    });

    // Combine header and rows
    const csvContent = [headerRow, ...rows].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
