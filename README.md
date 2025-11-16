# Electricity Monitoring Web Application

A personal web application for recording electricity meter readings (KWh) and providing real-time analytical insights such as usage per day, week, and month.

## Features

- **Manual Input**:** Record meter readings with optional token information
- **Local Storage**: SQLite database for permanent data storage
- **Analytics Dashboard**: View daily, weekly, and monthly usage patterns
- **Cost Estimation**: Calculate costs based on token purchases
- **Token Prediction**: Predict when your token will be depleted
- **Modern UI**: Responsive, mobile-friendly interface built with React and TailwindCSS
- **No Authentication**: Simple single-user system

## Tech Stack

### Backend
- Node.js + Express
- SQLite3
- RESTful API

### Frontend
- React 18
- TailwindCSS
- Recharts (for data visualization)
- React Router
- Axios

## Project Structure

```
.
├── backend/
│   ├── database/
│   │   └── db.js              # Database initialization and connection
│   ├── routes/
│   │   ├── readings.js        # CRUD endpoints for readings
│   │   └── analytics.js       # Analytics endpoints
│   ├── server.js              # Express server setup
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js      # API client configuration
│   │   ├── components/
│   │   │   ├── Layout.js      # Navigation layout
│   │   │   ├── StatCard.js    # Dashboard stat cards
│   │   │   └── charts/
│   │   │       ├── DailyChart.js
│   │   │       ├── WeeklyChart.js
│   │   │       └── MonthlyChart.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js   # Main dashboard
│   │   │   ├── InputForm.js   # Input form page
│   │   │   └── History.js     # History table page
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

### Environment Variables (Optional)

Create a `.env` file in the frontend directory to customize the API URL:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Endpoints

### Readings
- `POST /api/readings` - Create a new meter reading
- `GET /api/readings` - Get all readings (optional query: `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`)
- `GET /api/readings/latest` - Get the most recent reading

### Analytics
- `GET /api/analytics/daily?days=30` - Get daily usage analytics
- `GET /api/analytics/weekly?weeks=12` - Get weekly usage analytics
- `GET /api/analytics/monthly?months=12` - Get monthly usage analytics
- `GET /api/analytics/prediction` - Get token depletion prediction and cost analytics

## Database Schema

### Table: `meter_readings`

| Field         | Type            | Description                    |
|---------------|-----------------|--------------------------------|
| id            | INTEGER (PK)    | Unique identifier              |
| reading_kwh   | REAL            | Current meter reading (required)|
| token_amount  | REAL (nullable) | Purchased token amount         |
| token_cost    | REAL (nullable) | Cost of token                  |
| notes         | TEXT (nullable) | Additional remarks             |
| created_at    | DATETIME        | Auto timestamp                 |

## Usage

1. **Input Reading**: Navigate to "Input Reading" page and enter your meter reading. Optionally add token information and notes.

2. **View Dashboard**: The dashboard shows:
   - Monthly usage summary
   - Daily average consumption
   - Token depletion prediction
   - Last input summary
   - Cost estimation (if token cost is provided)
   - Interactive charts for daily, weekly, and monthly usage

3. **View History**: Check the "History" page to see all recorded readings in a table format.

## Development

### Adding New Features

The codebase is structured to be easily extensible:

- **Backend**: Add new routes in `backend/routes/` and register them in `server.js`
- **Frontend**: Add new pages in `frontend/src/pages/` and components in `frontend/src/components/`
- **API**: Extend the API client in `frontend/src/api/client.js`

### Database Migrations

The database is automatically initialized on first run. To modify the schema, update the `createTables()` function in `backend/database/db.js`.

## License

ISC

## Notes

- The database file (`electricity_monitoring.db`) is created automatically in the `backend/database/` directory
- All data is stored locally - no external services required
- The application is designed for personal use with no authentication

