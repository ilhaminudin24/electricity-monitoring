# Quick Start Guide

## Installation Steps

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## First Use

1. **Add Your First Reading**: 
   - Click "Input Reading" in the navigation
   - Enter your current meter reading (kWh) - this is required
   - Optionally add token amount and cost if you purchased electricity tokens
   - Add any notes if needed
   - Click "Save Reading"

2. **View Dashboard**:
   - The dashboard will show your usage statistics
   - Charts will populate as you add more readings over time

3. **View History**:
   - Check the "History" page to see all your recorded readings

## Notes

- The database file (`electricity_monitoring.db`) is automatically created in `backend/database/` on first run
- For accurate analytics, enter readings regularly (daily or weekly)
- Token predictions require at least 30 days of usage data for accurate forecasting
- Cost calculations only appear if you've entered token cost information

## Troubleshooting

- **Backend won't start**: Make sure port 5000 is not in use
- **Frontend won't start**: Make sure port 3000 is not in use
- **Charts not showing**: Add more readings over multiple days/weeks
- **API errors**: Make sure the backend is running before starting the frontend

