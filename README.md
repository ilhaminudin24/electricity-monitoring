# Electricity Monitoring Web Application

A personal web application for recording electricity meter readings (KWh) and providing real-time analytical insights such as usage per day, week, and month.

## Features

- **Manual Input**: Record meter readings with optional token information
- **Cloud Storage**: Supabase PostgreSQL database for permanent data storage
- **Authentication**: Email/Password and Google OAuth login
- **Analytics Dashboard**: View daily, weekly, and monthly usage patterns
- **Cost Estimation**: Calculate costs based on token purchases
- **Token Prediction**: Predict when your token will be depleted
- **Multi-Language**: Support for English and Indonesian (i18n)
- **Modern UI**: Responsive, mobile-friendly interface built with React and TailwindCSS

## Tech Stack

### Frontend
- React 18
- TailwindCSS
- Recharts (for data visualization)
- React Router v6
- Framer Motion (animations)
- i18next (internationalization)

### Backend/Database
- Supabase (PostgreSQL + Auth + Storage)

## Project Structure

```
.
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Auth)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── i18n/             # Internationalization files
│   │   ├── pages/            # Page components
│   │   │   └── cms/          # CMS editor pages
│   │   ├── services/         # Service layers
│   │   │   ├── supabaseService.js
│   │   │   ├── cmsService.js
│   │   │   └── tariffService.js
│   │   ├── utils/            # Utility functions
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   └── supabaseClient.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── scripts/                  # Migration scripts
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.supabase.example .env.local
```

4. Configure Supabase credentials in `.env.local`:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Deployment

### GitHub Pages

Deploy to GitHub Pages:
```bash
npm run deploy
```

This will build the app and push to the `gh-pages` branch.

## Usage

1. **Register/Login**: Create an account or login with email/Google
2. **Input Reading**: Navigate to "Input Reading" page and enter your meter reading
3. **View Dashboard**: See monthly usage, daily average, and charts
4. **View History**: Check all recorded readings in a table format
5. **Settings**: Configure tariff rates and preferences

## License

ISC

## Notes

- All data is stored in Supabase cloud database
- Authentication is handled by Supabase Auth
- The application supports multiple devices with cloud sync
