# Options Tracker

A professional full-stack web application for tracking stock positions, covered calls, cash-secured puts, and option rolling strategies. Features added by **Neodius** to support cloud deployment and PostgreSQL.

## Features

- **Portfolio Tracking**: Monitor stock positions with real-time P&L calculations
- **Covered Calls**: Create and track covered call positions linked to underlying stocks
- **Cash-Secured Puts**: Manage CSP positions with capital requirement tracking
- **Option Rolling**: Roll options to new strikes/expirations while maintaining history
- **CSV Import**: Import transactions from Fidelity and Schwab
- **Dashboard**: Overview of portfolio value, premium collected, and expiring options

## Tech Stack

### Backend
- ASP.NET Core 8 Web API
- Entity Framework Core
- **PostgreSQL** (Production) / SQL Server (Local)
- CsvHelper for CSV parsing

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Prerequisites

- .NET 8 SDK
- SQL Server (LocalDB, Express, or Full)
- Node.js 18+ and npm
- Visual Studio 2022 or VS Code

## Setup Instructions

### Quick Start with Docker (Recommended)

The easiest way to run the entire application:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/options-tracker.git
cd options-tracker

# Start everything with Docker
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

That's it! Docker will handle the database, backend, and frontend automatically.

## 🚀 Cloud Deployment (Railway)

This version is pre-configured for one-click deployment on **Railway** using PostgreSQL.

### 1. Database Setup
1. Create a **PostgreSQL** service in your Railway project.
2. The backend will automatically detect and connect to the database using the internal connection string.

### 2. Environment Variables

#### Backend Service:
- `FRONTEND_URL`: `https://your-frontend-domain.up.railway.app`
- `PORT`: `80` (Standard)
- `APP_PASSWORD`: Set any password here to protect your application. If this is empty, authentication will be disabled.

#### Frontend Service:
- `VITE_API_URL`: `https://your-backend-domain.up.railway.app/api` (Ensure `/api` is at the end!)

### 3. Critical Fixes & Security
- **Simple Authentication**: If you set `APP_PASSWORD`, the app will require a login screen.
- **Postgres DateTime Fix**: Pre-configured with legacy timestamp behavior to prevent Npgsql save errors.
- **Dynamic Port Binding**: Automatically binds to Railway's assigned port to prevent 502 Bad Gateway errors.
- **CORS Preflight Fix**: Optimized for reverse proxies to ensure secure cross-origin communication.


### Manual Setup

If you prefer to run without Docker:

### 1. Database Setup

Update the connection string in `Backend/appsettings.json` if needed:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=OptionsTrackerDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

### 2. Backend Setup

```bash
cd Backend

# Restore packages
dotnet restore

# Create database and run migrations
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run the API
dotnet run
```

The API will be available at `https://localhost:7001` and `http://localhost:5000`

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Database Migrations

When you make changes to the models:

```bash
cd Backend

# Add a new migration
dotnet ef migrations add YourMigrationName

# Apply migrations to database
dotnet ef database update

# Remove last migration (if needed)
dotnet ef migrations remove
```

## API Endpoints

### Positions
- `GET /api/positions` - Get all positions
- `GET /api/positions/{id}` - Get position by ID
- `POST /api/positions` - Create/update position
- `PUT /api/positions/{id}/price` - Update current price
- `DELETE /api/positions/{id}` - Delete position

### Options
- `GET /api/options` - Get all options positions
- `GET /api/options/{id}` - Get option by ID
- `POST /api/options/covered-calls` - Create covered call
- `POST /api/options/cash-secured-puts` - Create cash-secured put
- `POST /api/options/roll` - Roll an option
- `GET /api/options/roll-history` - Get roll history
- `POST /api/options/{id}/close` - Close option position
- `GET /api/options/dashboard` - Get dashboard summary

### Import
- `POST /api/import/csv` - Import CSV file
- `GET /api/import/brokers` - Get supported brokers

## Usage Guide

### 1. Import Transactions

1. Navigate to the Import page
2. Select your broker (Fidelity or Schwab)
3. Enter an account name
4. Upload your CSV export file
5. Click Import

The system will automatically:
- Parse transactions
- Create/update stock positions
- Create options positions
- Avoid duplicates

### 2. Track Stock Positions

The Positions page shows:
- Current holdings
- Cost basis and average price
- Current market value
- Unrealized P&L
- Number of covered calls

### 3. Create Covered Calls

From a position:
1. Click "Sell CC" next to the position
2. Enter strike price, expiration, contracts, and premium
3. The system validates you have enough shares
4. Premium collected is tracked

### 4. Create Cash-Secured Puts

1. Navigate to Options > New CSP
2. Enter symbol, strike, expiration, contracts, premium
3. Required capital is automatically calculated
4. Premium collected is tracked

### 5. Roll Options

When an option is near expiration:
1. Click "Roll" next to the option
2. Enter new strike and expiration
3. Enter closing premium for old position
4. Enter opening premium for new position
5. System tracks net credit/debit and maintains history

## CSV Format

### Fidelity CSV Format
Required columns:
- Date / Settlement Date
- Action
- Symbol
- Security Description
- Security Type
- Quantity
- Price
- Amount
- Fees
- Commission

### Schwab CSV Format
Required columns:
- Date
- Action
- Symbol
- Description
- Quantity
- Price
- Amount
- Fees & Comm

## Project Structure

```
OptionsTracker/
├── Backend/
│   ├── Controllers/       # API endpoints
│   ├── Models/           # Database entities
│   ├── Services/         # Business logic
│   ├── Data/            # DbContext
│   ├── DTOs/            # Data transfer objects
│   ├── Utilities/       # CSV parsers
│   └── Program.cs       # Application startup
│
└── Frontend/
    └── src/
        ├── api/         # API client
        ├── components/  # Reusable components
        ├── pages/      # Page components
        ├── types/      # TypeScript types
        ├── utils/      # Utility functions
        └── App.tsx     # Main app component
```

## Future Enhancements

- [ ] Schwab API integration for real-time data
- [ ] Options Greeks calculations
- [ ] Advanced filtering and search
- [ ] Performance analytics and charts
- [ ] Export to Excel
- [ ] Mobile responsive improvements
- [ ] User authentication
- [ ] Multiple account support
- [ ] Tax reporting (wash sales, gains/losses)
- [ ] Alerts for expiring options

## Development

### Run with Watch Mode

Backend:
```bash
cd Backend
dotnet watch run
```

Frontend:
```bash
cd Frontend
npm run dev
```

### Build for Production

Backend:
```bash
cd Backend
dotnet publish -c Release -o ./publish
```

Frontend:
```bash
cd Frontend
npm run build
```

## Troubleshooting

### Database Connection Issues
- Ensure SQL Server is running
- Check connection string in appsettings.json
- Verify credentials and server name

### CORS Errors
- Ensure backend allows frontend origin in Program.cs
- Check that API_URL in frontend matches backend URL

### CSV Import Failures
- Verify CSV format matches broker requirements
- Check for special characters or encoding issues
- Review error messages in import result

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
