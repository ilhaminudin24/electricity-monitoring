# Features Update Summary

## New Features Implemented

### 1. Auto-Calculate Token Amount from Token Cost
- **Formula**: `kWh = (TokenCost - PajakAdminEstimasi) / TarifPerKWh`
- Token Amount is automatically calculated when Token Cost is entered
- Token Amount field is now read-only (auto-calculated)
- Real-time calculation as user types Token Cost

### 2. Indonesian Rupiah Formatting
- Token Cost field uses Indonesian Rupiah (IDR) formatting
- Locale: `id-ID`
- Format: `Rp 200.000` (with thousand separators using dots)
- Applied in:
  - Input form (live formatting as user types)
  - History table
  - Dashboard cost estimation

### 3. Configurable Settings
- New Settings page accessible from navigation
- Configurable values:
  - **Tariff per kWh**: Default 1,444.70 (PLN R1 tariff)
  - **Admin Fee**: Default 0 (Pajak/Admin fees)
- Settings stored in browser localStorage
- Formula display with example calculation

### 4. Updated Components

#### InputForm
- Token Cost input with live Rupiah formatting
- Auto-calculated Token Amount (read-only, disabled)
- Visual feedback showing calculated value
- Real-time updates as user types

#### History Table
- Token Cost displayed in formatted Rupiah
- Token Amount shows calculated value with "kWh" unit
- Backward compatible: shows "-" for entries without Token Amount

#### Dashboard
- Cost estimation shows values in Rupiah format
- Cost per kWh, Estimated Monthly Cost formatted as Rupiah

#### Settings Page
- Configure tariff and admin fees
- Reset to defaults option
- Formula explanation with example

## Technical Implementation

### New Utilities
- `frontend/src/utils/settings.js`: Settings management with localStorage
- `frontend/src/utils/rupiah.js`: Rupiah formatting and parsing utilities

### Updated Files
- `frontend/src/pages/InputForm.js`: Auto-calculation and Rupiah formatting
- `frontend/src/pages/History.js`: Rupiah display in table
- `frontend/src/pages/Dashboard.js`: Rupiah formatting for costs
- `frontend/src/pages/Settings.js`: New settings page
- `frontend/src/components/Layout.js`: Added Settings navigation link
- `frontend/src/App.js`: Added Settings route

## Backward Compatibility
- Older entries without Token Amount display "-" in History table
- Existing data structure unchanged (SQLite schema remains the same)
- Settings default to PLN R1 tariff if not configured

## Usage Example

1. **Enter Token Cost**: User types `200000` in Token Cost field
2. **Live Formatting**: Field shows `200.000` with `Rp 200.000` displayed on the right
3. **Auto-Calculation**: Token Amount automatically shows `138.40 kWh` (calculated using formula)
4. **Save**: Both Token Cost (as numeric value) and Token Amount (calculated) are saved to database
5. **Display**: History table shows Token Cost as `Rp 200.000` and Token Amount as `138.40 kWh`

## Configuration

Users can adjust the tariff and admin fees in Settings:
- Navigate to Settings page
- Update Tariff per kWh (default: 1,444.70)
- Update Admin Fee (default: 0)
- Click "Save Settings"

Changes apply immediately to new calculations.

