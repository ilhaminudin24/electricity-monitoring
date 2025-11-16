# Electricity Monitoring Web Application - Full Requirements

## 1. Introduction

This project is a personal web application designed to record
electricity meter readings (KWh) and provide real-time analytical
insights such as usage per day, week, and month. The system focuses on
simplicity, modern UI, and efficient data storage using a local
database.

## 2. Purpose of the System

To allow the user to manually input electricity meter readings and
automatically generate meaningful consumption analytics and visual
dashboards.

## 3. Scope of Work

Includes: - Manual input form - SQLite-based local data storage -
Analytics & charts (daily, weekly, monthly usage) - Cost estimation -
Predicted token depletion - Modern dashboard UI (mobile-friendly) - No
login/authentication - No external integrations

## 4. User Roles

-   **Single User (Owner)**: full access to input and view dashboard.

## 5. Functional Requirements

### Input Module

-   Input fields:
    -   Meter Reading (KWh) --- required\
    -   Auto timestamp\
    -   Token amount (optional)\
    -   Token cost (optional)\
    -   Notes (optional)

### Dashboard

-   Highlight cards:
    1.  Total monthly KWh usage
    2.  Daily average usage
    3.  Token depletion prediction
    4.  Last input summary
-   Interactive charts:
    -   Daily usage
    -   Weekly usage
    -   Monthly usage
-   Cost estimation analytics
-   History table

## 6. Non-Functional Requirements

-   Simple local deployment (1 environment only)
-   Data stored permanently in SQLite
-   Mobile-friendly modern dashboard
-   Fast loading and responsive
-   Stable performance for personal use

## 7. Data Storage

-   SQLite (local `.db` file)
-   Table: `meter_readings`

## 8. Data Model

### Table: meter_readings

  Field          Type               Description
  -------------- ------------------ -----------------------
  id             integer, PK        unique ID
  reading_kwh    float              current meter reading
  token_amount   float (nullable)   purchased token
  token_cost     float (nullable)   cost of token
  notes          text (nullable)    remarks
  created_at     datetime           auto timestamp

Derived calculations: - Interval usage\
- Daily/weekly/monthly aggregation\
- Cost estimation\
- Token depletion forecast

## 9. API Structure

    POST   /api/readings           
    GET    /api/readings           
    GET    /api/readings/latest    
    GET    /api/analytics/monthly  
    GET    /api/analytics/daily    
    GET    /api/analytics/prediction

## 10. High-Level Architecture

    Frontend (React + TailwindCSS)
      └── Dashboard + Input Forms

    Backend (Node.js + Express)
      └── SQLite database (local file)
          └── meter_readings table

## 11. Tech Stack Recommendation

### Free / Basic (Recommended)

-   React + TailwindCSS\
-   Node.js + Express\
-   SQLite\
-   Chart.js / Recharts

### Paid (Optional)

-   None required

## 12. Implementation Plan

### Phase 1 --- Setup

-   Initialize frontend & backend
-   Setup SQLite schema
-   Connect API

### Phase 2 --- Input Functionality

-   Create form
-   Save data to SQLite
-   History page

### Phase 3 --- Analytics Engine

-   Daily, weekly, monthly usage logic
-   Prediction logic
-   Analytics API endpoints

### Phase 4 --- Dashboard UI

-   Summary cards
-   Charts
-   Mobile responsive layout

### Phase 5 --- Testing & Deployment

-   Validate calculations
-   Deploy locally

## 13. Cursor Prompt

Build a complete personal electricity monitoring web application with
the following requirements:

### Core Features

-   Manual input of electricity meter readings
-   Local SQLite storage
-   No login
-   Modern mobile-friendly dashboard

### Backend (Node.js + Express)

-   CRUD for readings
-   Analytics endpoints
-   SQLite storage

### Frontend (React + Tailwind)

-   Dashboard with charts
-   Input form
-   History table

Ensure modular, clean, and extendable architecture.
