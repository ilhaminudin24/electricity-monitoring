# Electricity Monitoring App - Core Process Documentation

## Table of Contents
- [Application Overview](#application-overview)
- [System Architecture](#system-architecture)
- [Core Processes](#core-processes)
  - [1. Authentication Flow](#1-authentication-flow)
  - [2. Meter Reading Input](#2-meter-reading-input)
  - [3. Dashboard Analytics](#3-dashboard-analytics)
  - [4. Reading History Management](#4-reading-history-management)
  - [5. Settings Management](#5-settings-management)
  - [6. Token/Tariff Calculation](#6-tokentariff-calculation)
- [UI/UX Features](#uiux-features)
  - [7. Internationalization (i18n)](#7-internationalization-i18n)
  - [8. Premium UI Design System](#8-premium-ui-design-system)
- [Data Flow Overview](#data-flow-overview)

---

## Application Overview

The **Electricity Monitoring Web Application** is a personal web application for recording electricity meter readings (kWh) and providing real-time analytical insights such as usage per day, week, and month.

### Key Features
| Feature | Description |
|---------|-------------|
| **Manual Input** | Record meter readings with optional token information via tabbed interface |
| **Smart Top-Up** | Auto-calculate new meter position based on token purchase |
| **Cloud Storage** | Supabase PostgreSQL database for permanent data storage |
| **Authentication** | Email/Password and Google OAuth login |
| **Analytics Dashboard** | View daily, weekly, and monthly usage patterns with premium charts |
| **Cost Estimation** | Calculate costs based on tariff configurations with budget tracking |
| **Token Prediction** | Predict when your token will be depleted with remaining kWh display |
| **Multi-Language** | Full support for English and Indonesian (i18n) |
| **Premium UI** | Modern glassmorphism design with dark mode and smooth animations |
| **Responsive Layout** | Sidebar navigation with mobile-friendly design |

### Tech Stack
```mermaid
flowchart TB
    subgraph Frontend
        React["React 18"]
        Tailwind["TailwindCSS"]
        Recharts["Recharts"]
        Router["React Router v6"]
        Framer["Framer Motion"]
        i18n["i18next"]
        Lucide["Lucide Icons"]
    end
    
    subgraph Backend
        Supabase["Supabase"]
        Postgres["PostgreSQL"]
        Auth["Supabase Auth"]
        Storage["Supabase Storage"]
    end
    
    Frontend --> Backend
```

---

## System Architecture

```mermaid
flowchart TB
    subgraph UserInterface["User Interface Layer"]
        Landing["Landing Page"]
        Login["Login/Register"]
        Dashboard["Dashboard"]
        InputForm["Input Form (Tabbed)"]
        History["History"]
        Settings["Settings"]
        CMS["CMS (Admin)"]
    end
    
    subgraph CoreComponents["Core Components Layer"]
        AuthContext["AuthContext"]
        ProtectedRoute["ProtectedRoute"]
        Layout["Layout + VoltaicSidebar"]
        Charts["Chart Components"]
        Modals["Modal Components"]
        DashboardCards["Dashboard Cards"]
        LangSwitcher["LanguageSwitcher"]
    end
    
    subgraph DashboardComponents["Dashboard Components"]
        TotalUsageCard["TotalUsageCard"]
        EstCostCard["EstCostCard"]
        TokenPrediction["TokenPredictionCard"]
        MainUsageChart["MainUsageChart"]
        AlertBox["AlertBox"]
        RecentReadings["RecentReadingsList"]
    end
    
    subgraph Services["Service Layer"]
        SupabaseService["supabaseService.js"]
        TariffService["tariffService.js"]
        CMSService["cmsService.js"]
    end
    
    subgraph Utils["Utilities Layer"]
        Analytics["analytics.js"]
        Tariff["tariff.js"]
        SettingsUtil["settings.js"]
        DateUtil["date.js"]
        RupiahUtil["rupiah.js"]
        LocaleFormatter["localeFormatter.js"]
        ValidationService["validationService.js"]
    end
    
    subgraph i18nLayer["Internationalization"]
        i18nConfig["i18n/index.js"]
        EnLocale["en.json"]
        IdLocale["id.json"]
        EnPublic["locales/en/public.json"]
        IdPublic["locales/id/public.json"]
    end
    
    subgraph External["External Services"]
        Supabase["Supabase"]
        SupabaseAuth["Supabase Auth"]
        SupabaseDB["PostgreSQL"]
        SupabaseStorage["Supabase Storage"]
    end
    
    UserInterface --> CoreComponents
    CoreComponents --> DashboardComponents
    CoreComponents --> Services
    Services --> Utils
    Services --> External
    CoreComponents --> i18nLayer
```

---

## Core Processes

### 1. Authentication Flow

The authentication system uses Supabase Auth and supports multiple authentication methods with premium UI design.

#### Authentication Methods
- **Email/Password Registration** - With email confirmation
- **Email/Password Login** - Secure session management
- **Google OAuth** - One-click social login
- **Password Reset via Email** - Secure recovery flow

#### Flow Diagram

```mermaid
flowchart TD
    Start([User Visits App]) --> CheckAuth{Session Exists?}
    
    CheckAuth -->|Yes| LoadUser[Load User Session]
    CheckAuth -->|No| ShowLanding[Show Landing Page]
    
    LoadUser --> EnsureProfile[Ensure User Profile Exists]
    EnsureProfile --> UpdateLogin[Update Last Login]
    UpdateLogin --> Dashboard[Redirect to Dashboard]
    
    ShowLanding --> AuthChoice{User Action}
    
    AuthChoice -->|Register| RegisterFlow
    AuthChoice -->|Login| LoginFlow
    AuthChoice -->|Google OAuth| OAuthFlow
    AuthChoice -->|Forgot Password| ResetFlow
    
    subgraph RegisterFlow["Registration Flow"]
        R1[Enter Email, Password, Name]
        R2[Call supabase.auth.signUp]
        R3{Email Confirmation?}
        R4[Send Confirmation Email]
        R5[User Confirms Email]
        R6[Trigger: Create User Profile]
        
        R1 --> R2 --> R3
        R3 -->|Required| R4 --> R5 --> R6
        R3 -->|Not Required| R6
    end
    
    subgraph LoginFlow["Login Flow"]
        L1[Enter Email, Password]
        L2[Call supabase.auth.signInWithPassword]
        L3{Valid Credentials?}
        L4[Set Session]
        L5[Show Translated Error Message]
        
        L1 --> L2 --> L3
        L3 -->|Yes| L4
        L3 -->|No| L5
    end
    
    subgraph OAuthFlow["Google OAuth Flow"]
        O1[Click Google Login]
        O2[supabase.auth.signInWithOAuth]
        O3[Redirect to Google]
        O4[User Authenticates]
        O5[Redirect to /auth/callback]
        O6[Process OAuth Callback]
        O7[Create/Update Profile]
        
        O1 --> O2 --> O3 --> O4 --> O5 --> O6 --> O7
    end
    
    subgraph ResetFlow["Password Reset Flow"]
        P1[Enter Email]
        P2[supabase.auth.resetPasswordForEmail]
        P3[Send Reset Email]
        P4[User Clicks Link]
        P5[Show Reset Form]
        P6[Update Password]
        
        P1 --> P2 --> P3 --> P4 --> P5 --> P6
    end
    
    R6 --> Dashboard
    L4 --> Dashboard
    O7 --> Dashboard
    P6 --> Dashboard
```

#### Key Files
| File | Responsibility |
|------|----------------|
| [AuthContext.js](file:///d:/Project/electricity-monitoring/frontend/src/contexts/AuthContext.js) | Authentication state management |
| [Login.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/Login.jsx) | Login page with premium UI |
| [Register.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/Register.jsx) | Registration with validation |
| [AuthCallback.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/AuthCallback.jsx) | OAuth callback handler |
| [ProtectedRoute.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/ProtectedRoute.jsx) | Route protection component |
| [ForgotPassword.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/ForgotPassword.jsx) | Password reset request |
| [ResetPassword.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/ResetPassword.jsx) | New password form |

---

### 2. Meter Reading Input

The core functionality for recording electricity meter readings with **tabbed interface** separating "Record Reading" and "Top Up Token" modes.

#### Input Modes

```mermaid
flowchart LR
    subgraph TabInterface["Tabbed Input Interface"]
        ReadingTab["📊 Record Reading<br/>(Blue Theme)"]
        TopUpTab["⚡ Top Up Token<br/>(Yellow Theme)"]
    end
    
    ReadingTab --> RecordConsumption["Record meter decrease<br/>Validates consumption"]
    TopUpTab --> SmartTopUp["Smart Pre-fill<br/>Auto-calculates new reading"]
```

#### Record Reading Flow

```mermaid
flowchart TD
    Start([User Opens Input Form]) --> LoadTiers[Load Tariff Tiers from Supabase]
    LoadTiers --> FetchLast[Fetch Last Reading for Reference]
    FetchLast --> SelectMode{Select Mode}
    
    SelectMode -->|Record Reading| ReadingMode
    SelectMode -->|Top Up Token| TopUpMode
    
    subgraph ReadingMode["Record Reading Mode (Blue)"]
        RM1[Enter Date/Time]
        RM2[Enter kWh Reading]
        RM3{Reading < Last Reading?}
        RM4[Calculate Consumption]
        RM5[Show Consumption Preview]
        RM6[Upload Optional Photo]
        RM7[Add Notes]
        
        RM1 --> RM2 --> RM3
        RM3 -->|Yes - Valid| RM4 --> RM5 --> RM6 --> RM7
        RM3 -->|No - Invalid| AnomalyModal
    end
    
    subgraph AnomalyModal["Reading Anomaly Detection"]
        AM1[Show ReadingAnomalyModal]
        AM2{User Action}
        AM3[Switch to Top Up Mode]
        AM4[Fix Input Value]
        
        AM1 --> AM2
        AM2 -->|Switch Mode| AM3
        AM2 -->|I Made a Mistake| AM4
    end
    
    subgraph TopUpMode["Top Up Token Mode (Yellow)"]
        TM1[Enter Token Cost in Rupiah]
        TM2[Auto-Calculate kWh Amount]
        TM3[Smart Pre-fill: Last + Purchased = New]
        TM4[Display New Meter Position]
        TM5[User Can Adjust if Needed]
        TM6[Upload Receipt Photo]
        TM7[Add Notes]
        
        TM1 --> TM2 --> TM3 --> TM4 --> TM5 --> TM6 --> TM7
    end
    
    RM7 --> Submit
    TM7 --> Submit
    AM3 --> TopUpMode
    AM4 --> ReadingMode
    
    subgraph Submit["Submit Flow"]
        S1[Validate All Inputs]
        S2{Duplicate Date Check}
        S3[Show DuplicateDateModal]
        S4[Ensure User Profile]
        S5{Photo Exists?}
        S6[Upload to Supabase Storage]
        S7[Insert Reading to DB]
        S8{Success?}
        S9[Show Success Toast]
        S10[Redirect to Dashboard]
        SE[Show Error Message]
        
        S1 --> S2
        S2 -->|Exists| S3
        S2 -->|No Conflict| S4
        S3 -->|Edit Existing| OpenEditModal
        S3 -->|Replace| ReplaceFlow
        S4 --> S5
        S5 -->|Yes| S6 --> S7
        S5 -->|No| S7
        S7 --> S8
        S8 -->|Yes| S9 --> S10
        S8 -->|No| SE
    end
```

#### Duplicate Date Handling

```mermaid
flowchart TD
    Duplicate[Duplicate Date Detected] --> Modal[Show DuplicateDateModal]
    Modal --> Choice{User Choice}
    
    Choice -->|Edit Existing| E1[Open EditReadingModal]
    E1 --> E2[Load Existing Record Data]
    E2 --> E3[User Edits Fields]
    E3 --> E4[Save Updates via onSave]
    E4 --> E5[Close Modal & Refresh]
    
    Choice -->|Replace With New| R1[Delete Existing Record]
    R1 --> R2[Insert New Record]
    R2 --> R3[Success Notification]
```

#### Data Structure

```mermaid
erDiagram
    electricity_readings {
        uuid id PK
        uuid user_id FK
        timestamp date
        decimal kwh_value
        decimal token_cost
        decimal token_amount
        text notes
        text meter_photo_url
        timestamp created_at
    }
    
    user_profiles {
        uuid id PK
        text display_name
        text role
        text status
        jsonb tariff_settings
        timestamp last_login
        timestamp created_at
    }
    
    user_profiles ||--o{ electricity_readings : has
```

#### Key Files
| File | Responsibility |
|------|----------------|
| [InputForm.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/InputForm.jsx) | Tabbed reading input form UI |
| [DuplicateDateModal.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/DuplicateDateModal.jsx) | Duplicate date conflict resolution |
| [ReadingAnomalyModal.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/ReadingAnomalyModal.jsx) | Reading validation warnings |
| [supabaseService.js](file:///d:/Project/electricity-monitoring/frontend/src/services/supabaseService.js) | `addReading()`, `updateReading()` functions |
| [settings.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/settings.js) | `calculateTokenAmount()` function |
| [tariff.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/tariff.js) | `estimateKwhFromTokenCost()` function |
| [validationService.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/validationService.js) | Reading validation logic |

---

### 3. Dashboard Analytics

The dashboard provides comprehensive analytics with a **premium VoltaicMonitor layout** featuring glassmorphism cards and responsive charts.

#### Dashboard Layout

```mermaid
flowchart TB
    subgraph DashboardLayout["Dashboard Layout Structure"]
        Header["Header with Welcome Message"]
        
        subgraph TopRow["Top Stats Row"]
            TotalUsage["TotalUsageCard<br/>Bar Chart + Stats"]
            EstCost["EstCostCard<br/>Budget Progress"]
            TokenPred["TokenPredictionCard<br/>Remaining kWh + Days"]
        end
        
        subgraph MainCharts["Main Charts Section"]
            subgraph SideBySide["Side-by-Side Charts"]
                ConsumptionTrends["Consumption Trends<br/>Area/Line/Bar Chart"]
                TokenBalance["Token Balance History<br/>Line Chart"]
            end
            MonthlyHistory["Monthly History<br/>Bar Chart (Bottom)"]
        end
        
        subgraph BottomSection["Bottom Section"]
            Alerts["AlertBox<br/>Usage Warnings"]
            RecentList["RecentReadingsList<br/>Last 5 Readings"]
        end
    end
    
    Header --> TopRow --> MainCharts --> BottomSection
```

#### Flow Diagram

```mermaid
flowchart TD
    Start([User Opens Dashboard]) --> CheckUser{User Authenticated?}
    
    CheckUser -->|No| Redirect[Redirect to Login]
    CheckUser -->|Yes| LoadData
    
    subgraph LoadData["Load Dashboard Data"]
        L1[Call getAllReadings - Limit 1000]
        L2{Readings Exist?}
        L3[Return Empty State]
        L4[Get Latest Reading]
        L5[Calculate Daily Usage - 30 days]
        L6[Calculate Weekly Usage - 12 weeks]
        L7[Calculate Monthly Usage - 12 months]
        L8[Calculate Token Prediction]
        L9[Load Budget Settings]
        
        L1 --> L2
        L2 -->|No| L3
        L2 -->|Yes| L4 --> L5 --> L6 --> L7 --> L8 --> L9
    end
    
    subgraph Analytics["Analytics Calculations"]
        direction TB
        A1[computeDailyUsage - Sorted Chronologically]
        A2[aggregateWeekly - Week Label Format]
        A3[aggregateMonthly - Month Names]
        A4[calculateTokenPrediction]
        A5[detectTopUpEvents]
        
        A1 --> A2
        A1 --> A3
        A1 --> A4
        A1 --> A5
    end
    
    L5 -.-> A1
    L6 -.-> A2
    L7 -.-> A3
    L8 -.-> A4
    
    LoadData --> FilterData
    
    subgraph FilterData["Global Filter Bar"]
        F1{Time Range Selection}
        F2[Filter: Day - Today vs Yesterday]
        F3[Filter: Week - Weekly Bars]
        F4[Filter: Month - Monthly Data]
        F5[Calculate Stats for Filtered Data]
        
        F1 -->|day| F2 --> F5
        F1 -->|week| F3 --> F5
        F1 -->|month| F4 --> F5
    end
    
    subgraph RenderComponents["Render Dashboard Components"]
        U1[GlobalFilterBar - Day/Week/Month Toggle]
        U2[TotalUsageCard - Bar Chart with Top-Up Markers]
        U3[EstCostCard - Budget Progress with Thresholds]
        U4[TokenPredictionCard - Remaining kWh & Days]
        U5[MainUsageChart - Dual Chart Layout]
        U6[AlertBox - Usage Warnings]
        U7[RecentReadingsList - Last 5 Entries]
        
        U1 --> U2 --> U3 --> U4 --> U5 --> U6 --> U7
    end
    
    F5 --> RenderComponents
```

#### Chart Features

```mermaid
mindmap
    root((Dashboard Charts))
        TotalUsageCard
            Bar Chart View
            Top-Up Event Markers (Yellow)
            Tooltip with Top-Up Info
            Period Comparison
        MainUsageChart
            Consumption Trends
                Day View: Today vs Yesterday
                Week View: Weekly Bars with Date Ranges
                Month View: Monthly Line Chart
            Token Balance History
                Line Chart
                Balance Over Time
            Monthly History Bar Chart
                Aggregated Monthly Data
                Est. Cost Tooltips
        EstCostCard
            Progress Bar
            Budget Thresholds
            Yellow at Alert %
            Red at Budget Limit
        TokenPrediction
            Remaining kWh Display
            Days Until Depletion
            Predicted Date
            Empty State Handling
```

#### Key Files
| File | Responsibility |
|------|----------------|
| [Dashboard.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/Dashboard.jsx) | Dashboard page orchestrator |
| [TotalUsageCard.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/dashboard/TotalUsageCard.jsx) | Usage bar chart with top-up markers |
| [EstCostCard.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/dashboard/EstCostCard.jsx) | Cost estimation with budget progress |
| [TokenPredictionCard.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/dashboard/TokenPredictionCard.jsx) | Token depletion prediction |
| [MainUsageChart.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/dashboard/MainUsageChart.jsx) | Consumption trends & balance charts |
| [GlobalFilterBar.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/dashboard/GlobalFilterBar.jsx) | Day/Week/Month toggle |
| [AlertBox.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/dashboard/AlertBox.jsx) | Usage warning alerts |
| [RecentReadingsList.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/dashboard/RecentReadingsList.jsx) | Recent readings display |
| [analytics.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/analytics.js) | Analytics calculation functions |

---

### 4. Reading History Management

Complete CRUD operations with **premium WattMonitor layout** including advanced filtering and pagination.

#### History Page Layout

```mermaid
flowchart TB
    subgraph HistoryLayout["History Page Layout"]
        Sidebar["VoltaicSidebar"]
        
        subgraph MainContent["Main Content Area"]
            Header["Title: Reading History<br/>Subtitle: Past readings and consumption data"]
            
            subgraph Filters["Filter Bar"]
                Search["🔍 Search Input<br/>Search by date, value, notes"]
                DateFilter["📅 Date Range<br/>Last 30 Days / 12 Months / All"]
                TypeFilter["⚡ Type Filter<br/>All / Reading / Top Up"]
            end
            
            subgraph DataTable["Data Table"]
                Columns["Date | Type | Meter | Consumption | Cost | Proof | Actions"]
                Rows["Paginated Reading Rows"]
                StatusBadges["Type Badges: Reading (Blue) / Top Up (Yellow)"]
            end
            
            subgraph Pagination["Pagination Controls"]
                RowsPerPage["Rows per page: 10/25/50"]
                PageNav["Page Navigation: < 1 2 3 ... >"]
            end
        end
    end
    
    Sidebar --> MainContent
```

#### Flow Diagram

```mermaid
flowchart TD
    Start([User Opens History Page]) --> LoadReadings
    
    subgraph LoadReadings["Load Readings"]
        L1[Call getReadings with Pagination]
        L2[Set Page Size = 10]
        L3[Calculate Total Pages]
        L4[Apply Client-side Filters]
        L5[Display Readings Table]
        
        L1 --> L2 --> L3 --> L4 --> L5
    end
    
    LoadReadings --> UserAction{User Action}
    
    UserAction -->|Filter| FilterFlow
    UserAction -->|View| DisplayTable
    UserAction -->|Edit| EditFlow
    UserAction -->|Delete| DeleteFlow
    UserAction -->|View Proof| ImageView
    UserAction -->|Navigate Page| ChangePage
    
    subgraph FilterFlow["Client-side Filtering"]
        FF1[Search: Match date/value/notes]
        FF2[Date Range: 30 days / 12 months / all]
        FF3[Type: All / Reading / Top Up]
        FF4[Apply useMemo for Performance]
    end
    
    subgraph DisplayTable["Table Display"]
        D1[Date Column - Formatted]
        D2[Type Column - Color-coded Badge]
        D3[Meter Value Column - kWh]
        D4[Consumption Column - Calculated]
        D5[Cost Column - Rupiah Format]
        D6[Proof Column - View Button]
        D7[Actions Column - Edit/Delete]
    end
    
    subgraph EditFlow["Edit Reading Flow (Mode-Locked)"]
        E1[Click Edit Button]
        E2[Open EditReadingModal]
        E3{Reading Type?}
        E4[Reading Mode - Blue Theme]
        E5[Top Up Mode - Yellow Theme]
        E6[Load Current Values]
        E7[User Modifies Data]
        E8[Validate Changes]
        E9[Call updateReading API]
        E10{Success?}
        E11[Close Modal + Show Success]
        E12[Refresh List]
        E13[Show Error]
        
        E1 --> E2 --> E3
        E3 -->|Reading| E4 --> E6
        E3 -->|Top Up| E5 --> E6
        E6 --> E7 --> E8 --> E9 --> E10
        E10 -->|Yes| E11 --> E12
        E10 -->|No| E13
    end
    
    subgraph DeleteFlow["Delete Reading Flow"]
        Del1[Click Delete Button]
        Del2[Open DeleteConfirmationModal]
        Del3{User Confirms?}
        Del4[Call deleteReading API]
        Del5{Success?}
        Del6[Close Modal + Show Success]
        Del7[Refresh List]
        Del8[Cancel]
        Del9[Show Error]
        
        Del1 --> Del2 --> Del3
        Del3 -->|Yes| Del4 --> Del5
        Del3 -->|No| Del8
        Del5 -->|Yes| Del6 --> Del7
        Del5 -->|No| Del9
    end
    
    subgraph ImageView["View Proof Image"]
        IV1[Click View Proof]
        IV2[Open Image in New Tab]
    end
```

#### Edit Modal Mode-Locking

```mermaid
flowchart LR
    subgraph EditModalModes["EditReadingModal - Mode-Locked Editing"]
        ReadingEdit["Reading Mode Edit<br/>• Blue theme<br/>• Only reading fields<br/>• Validates consumption"]
        TopUpEdit["Top Up Mode Edit<br/>• Yellow theme<br/>• Token cost fields<br/>• Auto-calculate kWh"]
    end
    
    ReadingEntry["Reading Entry"] -->|Edit| ReadingEdit
    TopUpEntry["Top Up Entry"] -->|Edit| TopUpEdit
```

#### Key Files
| File | Responsibility |
|------|----------------|
| [History.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/History.jsx) | Premium history page with filters |
| [EditReadingModal.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/EditReadingModal.jsx) | Mode-locked edit modal |
| [DeleteConfirmationModal.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/DeleteConfirmationModal.jsx) | Delete confirmation modal |
| [supabaseService.js](file:///d:/Project/electricity-monitoring/frontend/src/services/supabaseService.js) | CRUD operations |

---

### 5. Settings Management

User profile and tariff settings with **ElectroSaaS premium design** including budget configuration.

#### Settings Page Layout

```mermaid
flowchart TB
    subgraph SettingsLayout["Settings Page Layout"]
        Breadcrumb["Breadcrumb: Home > Settings & Tariff"]
        
        subgraph MainGrid["Two-Column Grid"]
            subgraph LeftColumn["Left Column"]
                ProfileCard["Profile Card<br/>• Avatar<br/>• Display Name (Editable)<br/>• Email (Read-only)<br/>• Role Badge"]
            end
            
            subgraph RightColumn["Right Column"]
                TariffSection["Tariff Configuration<br/>• PLN Official / Custom Toggle<br/>• Tariff Group Selector<br/>• Power Capacity<br/>• Effective Rate Display"]
                
                FeesSection["Base Rates & Fees<br/>• Admin Fee Input<br/>• Tax Percentage Input<br/>• Formula Display"]
                
                BudgetSection["Budget Configuration<br/>• Monthly Budget Input<br/>• Alert Threshold Slider<br/>• Daily/Weekly/Monthly Preview"]
            end
        end
        
        SaveButton["💾 Save Configuration Button"]
    end
```

#### Flow Diagram

```mermaid
flowchart TD
    Start([User Opens Settings]) --> LoadSettings
    
    subgraph LoadSettings["Load Settings - Hybrid Approach"]
        L1[Load Local Settings First - Instant]
        L2[Apply to State]
        L3{User Authenticated?}
        L4[Ensure User Profile Exists]
        L5[Load Cloud Settings from Supabase]
        L6[Merge Cloud → Local]
        L7[Apply Merged Settings]
        
        L1 --> L2 --> L3
        L3 -->|Yes| L4 --> L5 --> L6 --> L7
        L3 -->|No| DisplayForm
    end
    
    L7 --> DisplayForm
    L2 --> DisplayForm
    
    subgraph DisplayForm["Display Settings Form"]
        F1[Profile Section]
        F2[Display Name Input]
        F3[Email Display - Read Only]
        F4[Tariff Configuration Section]
        F5[PLN / Custom Tab Toggle]
        F6{Mode?}
        F7[PLN: Group + Capacity Selectors]
        F8[Custom: Name + Rate Inputs]
        F9[Additional Fees Section]
        F10[Admin Fee Input]
        F11[Tax Percentage Input]
        F12[Budget Configuration Section]
        F13[Monthly Budget Input]
        F14[Alert Threshold Slider]
        F15[Budget Preview Cards]
        
        F1 --> F2 --> F3 --> F4 --> F5 --> F6
        F6 -->|PLN| F7
        F6 -->|Custom| F8
        F7 --> F9
        F8 --> F9
        F9 --> F10 --> F11 --> F12 --> F13 --> F14 --> F15
    end
    
    DisplayForm --> UserAction{User Action}
    
    UserAction -->|Modify| UpdateState[Update Form State]
    UserAction -->|Save| SaveFlow
    UserAction -->|Reset| ResetFlow
    UserAction -->|Update Profile| ProfileFlow
    
    UpdateState --> UserAction
    
    subgraph SaveFlow["Save Settings Flow"]
        S1[Validate Inputs]
        S2{All Valid?}
        S3[Show Validation Errors]
        S4[Ensure User Profile]
        S5[Update Profile - Display Name]
        S6[Create Settings Object]
        S7[Save to LocalStorage]
        S8[Sync to Cloud via Supabase]
        S9[Show Success Message]
        S10[Redirect to Dashboard]
        
        S1 --> S2
        S2 -->|No| S3
        S2 -->|Yes| S4 --> S5 --> S6 --> S7 --> S8 --> S9 --> S10
    end
    
    subgraph ProfileFlow["Profile Update"]
        PF1[Click Edit Name]
        PF2[Enter New Display Name]
        PF3[Call updateUserProfile]
        PF4[Show Success Toast]
        
        PF1 --> PF2 --> PF3 --> PF4
    end
```

#### Budget Configuration

```mermaid
flowchart LR
    subgraph BudgetConfig["Budget Settings"]
        Monthly["Monthly Budget<br/>e.g., Rp 300,000"]
        Threshold["Alert Threshold<br/>e.g., 80%"]
    end
    
    Monthly --> AutoCalc["Auto-Calculate"]
    
    subgraph Preview["Budget Preview Cards"]
        Daily["Daily: Rp 10,000"]
        Weekly["Weekly: Rp 70,000"]
        MonthlyP["Monthly: Rp 300,000"]
    end
    
    AutoCalc --> Preview
    
    Threshold --> Alerts["Dashboard Alerts"]
    Alerts --> Yellow["Yellow at 80%"]
    Alerts --> Red["Red at 100%"]
```

#### Key Files
| File | Responsibility |
|------|----------------|
| [Settings.jsx](file:///d:/Project/electricity-monitoring/frontend/src/pages/Settings.jsx) | Premium settings page |
| [settings.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/settings.js) | Settings utility functions |
| [supabaseService.js](file:///d:/Project/electricity-monitoring/frontend/src/services/supabaseService.js) | Cloud settings sync |

---

### 6. Token/Tariff Calculation

Tiered tariff system for calculating kWh from token cost with support for PLN official rates.

#### Flow Diagram

```mermaid
flowchart TD
    Start([calculateTokenAmount Called]) --> ValidateInput
    
    subgraph ValidateInput["Input Validation"]
        V1{Token Cost > 0?}
        V2[Return null]
        
        V1 -->|No| V2
        V1 -->|Yes| GetSettings
    end
    
    subgraph GetSettings["Get Settings"]
        G1[Get Admin Fee]
        G2[Get Tax Percent]
        G3[Check useGlobalTariffTiers Flag]
        G4[Check Feature Flag]
        
        G1 --> G2 --> G3 --> G4
    end
    
    GetSettings --> TierCheck{Use Tiered System?}
    
    TierCheck -->|Yes| TieredCalc
    TierCheck -->|No| LegacyCalc
    
    subgraph TieredCalc["Tiered Calculation"]
        T1[Import estimateKwhFromTokenCost]
        T2[Pass tokenCost, adminFee, taxPercent]
        T3[Lookup Tier by Nominal]
        T4{Tier Found?}
        T5[Get effective_tariff from Tier]
        T6[Calculate: netAmount / effectiveTariff]
        T7[Return kWh Result]
        
        T1 --> T2 --> T3 --> T4
        T4 -->|Yes| T5 --> T6 --> T7
        T4 -->|No| FallbackCalc
    end
    
    subgraph FallbackCalc["Fallback Calculation"]
        F1[Use fallbackRate from Settings]
        F2[Calculate: netAmount / fallbackRate]
        F3[Return kWh Result]
        
        F1 --> F2 --> F3
    end
    
    subgraph LegacyCalc["Legacy Calculation"]
        L1[taxAmount = tokenCost × taxPercent / 100]
        L2[tariff = settings.tariffPerKwh]
        L3[effectiveCost = tokenCost - adminFee - taxAmount]
        L4[tokenAmount = effectiveCost / tariff]
        L5[Return max 0, tokenAmount]
        
        L1 --> L2 --> L3 --> L4 --> L5
    end
```

#### PLN Tariff Groups

```mermaid
graph TB
    subgraph TariffGroups["PLN Tariff Categories"]
        R1["R1 - Residential<br/>Low Power"]
        R1M["R1M - Non-subsidized<br/>Residential"]
        R2["R2 - Residential<br/>Medium Power"]
        R3["R3 - Residential<br/>High Power"]
        B1["B1 - Small Business"]
        B2["B2 - Medium Business"]
        P1["P1 - Government"]
    end
    
    subgraph R1Sub["R1 Power Options"]
        R1_450["450 VA - Rp 415/kWh ⭐"]
        R1_900["900 VA - Rp 1,352/kWh ⭐"]
        R1_1300["1300 VA - Rp 1,444.70/kWh"]
        R1_2200["2200 VA - Rp 1,444.70/kWh"]
    end
    
    R1 --> R1Sub
    
    Note["⭐ = Subsidized Tariff"]
```

#### Key Files
| File | Responsibility |
|------|----------------|
| [settings.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/settings.js) | `calculateTokenAmount()` entry point |
| [tariff.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/tariff.js) | `estimateKwhFromTokenCost()` function |
| [tariffService.js](file:///d:/Project/electricity-monitoring/frontend/src/services/tariffService.js) | Supabase tariff operations |

---

## UI/UX Features

### 7. Internationalization (i18n)

Full multi-language support for English and Indonesian using i18next.

#### i18n Architecture

```mermaid
flowchart TB
    subgraph i18nSetup["i18n Configuration"]
        Config["i18n/index.js<br/>Initialize i18next"]
        Detector["Language Detector<br/>localStorage / Browser"]
    end
    
    subgraph TranslationFiles["Translation Files"]
        subgraph CoreTranslations["Core App Translations"]
            EN["i18n/en.json"]
            ID["i18n/id.json"]
        end
        
        subgraph PublicTranslations["Public Pages"]
            EnPublic["locales/en/public.json"]
            IdPublic["locales/id/public.json"]
        end
    end
    
    subgraph Components["Using Translations"]
        Hook["useTranslation() Hook"]
        Switcher["LanguageSwitcher Component"]
    end
    
    Config --> TranslationFiles
    Detector --> Config
    TranslationFiles --> Components
```

#### Translation Namespaces

| Namespace | Location | Usage |
|-----------|----------|-------|
| Default | `i18n/en.json`, `i18n/id.json` | All authenticated pages |
| Public | `locales/en/public.json`, `locales/id/public.json` | Landing page, auth pages |

#### Translation Categories

```mermaid
mindmap
    root((Translation Keys))
        common
            save, cancel, delete
            edit, loading, error
        nav
            home, dashboard
            inputReading, history
            settings
        dashboard
            title, subtitle
            totalUsage, costEstimation
            tokenPrediction
        input
            tabRecordReading
            tabTopUp
            validation messages
        history
            title, columns
            filters, actions
        settings
            tariffConfiguration
            budgetConfig
            validation
        auth
            signIn, register
            forgotPassword
            validation
        validation
            readingIncreasedError
            mustUseTopUp
            switchToTopUp
```

#### Key Files
| File | Responsibility |
|------|----------------|
| [i18n/index.js](file:///d:/Project/electricity-monitoring/frontend/src/i18n/index.js) | i18n initialization |
| [i18n/en.json](file:///d:/Project/electricity-monitoring/frontend/src/i18n/en.json) | English translations |
| [i18n/id.json](file:///d:/Project/electricity-monitoring/frontend/src/i18n/id.json) | Indonesian translations |
| [LanguageSwitcher.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/LanguageSwitcher.jsx) | Language toggle component |
| [localeFormatter.js](file:///d:/Project/electricity-monitoring/frontend/src/utils/localeFormatter.js) | Locale-aware formatting |

---

### 8. Premium UI Design System

Modern glassmorphism design with consistent theming across all pages.

#### Design Components

```mermaid
flowchart TB
    subgraph DesignSystem["Premium Design System"]
        subgraph Colors["Color Palette"]
            Primary["Primary: Indigo/Blue<br/>#4F46E5"]
            Secondary["Secondary: Emerald<br/>#10B981"]
            Accent["Accent: Yellow<br/>#F59E0B"]
            Dark["Dark Mode: Slate<br/>#1E293B"]
        end
        
        subgraph Effects["Visual Effects"]
            Glass["Glassmorphism<br/>backdrop-blur + opacity"]
            Gradients["Subtle Gradients<br/>background transitions"]
            Shadows["Layered Shadows<br/>depth perception"]
            Micro["Micro-animations<br/>hover/focus states"]
        end
        
        subgraph Layout["Layout Components"]
            Sidebar["VoltaicSidebar<br/>Collapsible navigation"]
            Cards["Stat Cards<br/>Glassmorphic containers"]
            Tables["Premium Tables<br/>Striped + hover"]
            Modals["Modal Dialogs<br/>Centered + animated"]
        end
    end
```

#### Component Themes

| Component | Theme | Color |
|-----------|-------|-------|
| Record Reading | Blue | `#3B82F6` |
| Top Up Token | Yellow/Amber | `#F59E0B` |
| Reading Badge | Blue | `bg-blue-100` |
| Top Up Badge | Yellow | `bg-yellow-100` |
| Success State | Green | `#10B981` |
| Error State | Red | `#EF4444` |
| Warning State | Amber | `#F59E0B` |

#### Key Files
| File | Responsibility |
|------|----------------|
| [VoltaicSidebar.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/VoltaicSidebar.jsx) | Premium sidebar navigation |
| [Layout.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/Layout.jsx) | Page layout wrapper |
| [StatCard.jsx](file:///d:/Project/electricity-monitoring/frontend/src/components/StatCard.jsx) | Glassmorphic stat cards |
| [index.css](file:///d:/Project/electricity-monitoring/frontend/src/index.css) | Global styles |

---

## Data Flow Overview

### Complete Application Data Flow

```mermaid
flowchart TB
    subgraph UserActions["User Actions"]
        Login[Login/Register]
        Input[Input Reading]
        ViewDash[View Dashboard]
        ViewHist[View History]
        Config[Configure Settings]
        SwitchLang[Switch Language]
    end
    
    subgraph Frontend["Frontend Processing"]
        AuthContext[AuthContext]
        Forms[Form Components]
        Analytics[Analytics Utils]
        Charts[Chart Components]
        SettingsUtil[Settings Utils]
        i18nContext[i18n Context]
    end
    
    subgraph Services["Service Layer"]
        SupabaseService[supabaseService.js]
        TariffService[tariffService.js]
    end
    
    subgraph Supabase["Supabase Backend"]
        Auth[Supabase Auth]
        DB[(PostgreSQL)]
        Storage[Supabase Storage]
        RPC[RPC Functions]
    end
    
    Login --> AuthContext
    AuthContext --> Auth
    Auth --> DB
    
    Input --> Forms
    Forms --> SettingsUtil
    SettingsUtil --> TariffService
    TariffService --> RPC
    Forms --> SupabaseService
    SupabaseService --> DB
    SupabaseService --> Storage
    
    ViewDash --> SupabaseService
    SupabaseService --> Analytics
    Analytics --> Charts
    
    ViewHist --> SupabaseService
    SupabaseService --> DB
    
    Config --> SettingsUtil
    SettingsUtil --> SupabaseService
    SupabaseService --> DB
    
    SwitchLang --> i18nContext
    i18nContext --> LocalStorage[(LocalStorage)]
```

### State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> Authenticating: Login/Register
    Authenticating --> Authenticated: Success
    Authenticating --> Unauthenticated: Failure
    
    Authenticated --> Dashboard: Load Data
    Dashboard --> InputForm: Add Reading
    Dashboard --> History: View History
    Dashboard --> Settings: Configure
    
    InputForm --> ReadingMode: Select Record Reading
    InputForm --> TopUpMode: Select Top Up
    ReadingMode --> Dashboard: Save Success
    TopUpMode --> Dashboard: Save Success
    
    History --> EditModal: Edit Reading
    EditModal --> History: Save/Cancel
    History --> Dashboard: Navigate
    
    Settings --> Dashboard: Save Success
    
    Authenticated --> Unauthenticated: Logout
```

---

## Summary

This documentation covers the core processes and features of the Electricity Monitoring application:

| # | Process | Key Function |
|---|---------|--------------|
| 1 | **Authentication** | User management with email/OAuth support and premium UI |
| 2 | **Meter Reading Input** | Tabbed interface with Record Reading and Smart Top-Up modes |
| 3 | **Dashboard Analytics** | VoltaicMonitor layout with glassmorphic cards and responsive charts |
| 4 | **History Management** | Premium table with filters, pagination, and mode-locked editing |
| 5 | **Settings Management** | ElectroSaaS design with PLN tariffs and budget configuration |
| 6 | **Token Calculation** | Tiered tariff system for accurate kWh estimation |
| 7 | **Internationalization** | Full English and Indonesian language support |
| 8 | **Premium UI Design** | Modern glassmorphism with consistent theming |

### Integration Points

All processes are integrated through:
- **Supabase** for backend services (Auth, Database, Storage)
- **React Context** for state management (Auth, i18n)
- **Service layer** for API abstraction
- **Utility functions** for calculations and formatting
- **i18next** for multi-language support
- **TailwindCSS + Custom CSS** for premium styling
- **Recharts** for data visualization

### Recent Updates Summary

| Feature | Description |
|---------|-------------|
| **Tabbed Input Form** | Separate modes for Recording and Top-Up with distinct themes |
| **Smart Pre-fill** | Auto-calculate new meter position based on token purchase |
| **Reading Validation** | Detect anomalies when reading increases without top-up |
| **Duplicate Date Handling** | Modal to edit existing or replace records |
| **Mode-Locked Editing** | Edit modals respect the original entry type |
| **Budget Configuration** | User-configurable monthly budget with alert thresholds |
| **Chart Improvements** | Top-up markers, weekly date ranges, chronological sorting |
| **Premium Redesign** | All pages upgraded to glassmorphism design |
| **Full i18n Support** | Complete translations for EN and ID languages |
