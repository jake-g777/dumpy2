# Dumpy - Database Management & Data Import Tool

A modern, full-stack application for database management, data import, and reconciliation built with React, TypeScript, and Express.js.

##  Features

### Database Management
- **Multi-Database Support**: Connect to MySQL, PostgreSQL, MongoDB, SQL Server, and Oracle databases
- **Connection Testing**: Real-time database connection validation
- **Secure Storage**: Encrypted storage of database credentials
- **Connection Management**: Add, edit, and delete database connections
- **Query Execution**: Run custom queries against connected databases

### Data Import & Processing
- **File Import**: Support for CSV, JSON, and Excel files
- **API Import**: Import data from REST APIs
- **Data Preview**: Interactive data preview with pagination
- **Data Transformation**: Edit headers and manipulate data before import
- **JSON Processing**: Advanced JSON data parsing and path selection

### User Interface
- **Modern Dashboard**: Clean, responsive interface with dark theme support
- **Real-time Logging**: Live connection and operation logs
- **Error Handling**: Comprehensive error reporting and user feedback
- **Responsive Design**: Works on desktop and mobile devices

### Security
- **Credential Encryption**: Secure storage of sensitive database credentials
- **Environment Variables**: Configuration through environment variables
- **Input Validation**: Comprehensive input sanitization and validation

##  Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Multiple Database Drivers**: MySQL2, PostgreSQL, MongoDB, SQL Server, Oracle
- **Swagger** for API documentation
- **CORS** for cross-origin requests

### Development Tools
- **Electron** for desktop application
- **ESLint** for code linting
- **Nodemon** for development auto-reload
- **Concurrently** for running multiple processes

##  Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- One or more database servers (MySQL, PostgreSQL, MongoDB, SQL Server, or Oracle)

### Setup

1. **Clone the repository**
   `ash
   git clone https://github.com/yourusername/dumpy2.git
   cd dumpy2
   `

2. **Install dependencies**
   `ash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   cd ..
   `

3. **Environment Configuration**
   `ash
   # Copy environment template
   cp .env.example .env
   cp server/.env.example server/.env
   `

4. **Configure environment variables**
   Edit .env and server/.env files with your configuration:
   `env
   # Frontend (.env)
   REACT_APP_API_URL=http://localhost:3001/api
   
   # Backend (server/.env)
   PORT=3001
   NODE_ENV=development
   `

##  Running the Application

### Development Mode

**Option 1: Run both frontend and backend together**
`ash
npm run dev:all
`

**Option 2: Run separately**
`ash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
`

### Production Mode

`ash
# Build the application
npm run build

# Start the server
cd server
npm start
`

### Desktop Application

`ash
# Development
npm run electron:dev

# Build for production
npm run electron:build
`

##  Usage

### 1. Database Connections
- Navigate to the Dashboard
- Click "Database Connections" in the sidebar
- Add new connections by providing:
  - Connection name
  - Database type (MySQL, PostgreSQL, MongoDB, SQL Server, Oracle)
  - Host, port, database name
  - Username and password
- Test connections before saving

### 2. Data Import
- Choose "File Import" or "API Import"
- For file import: Upload CSV, JSON, or Excel files
- For API import: Provide API endpoint URL
- Preview and edit data before processing
- Select target database and table

### 3. Data Processing
- Edit column headers
- Filter and transform data
- Preview results before import
- Execute import operations

##  API Endpoints

The backend provides RESTful APIs for database operations:

- POST /api/mysql/test-connection - Test MySQL connection
- POST /api/postgresql/test-connection - Test PostgreSQL connection
- POST /api/mongodb/test-connection - Test MongoDB connection
- POST /api/sqlserver/test-connection - Test SQL Server connection
- POST /api/oracle/test-connection - Test Oracle connection
- GET /api/health - Health check endpoint
- GET /api-docs - Swagger API documentation

##  Project Structure

`
dumpy2/
 src/                    # Frontend React application
    components/         # React components
    pages/             # Page components
    services/          # API services
    context/           # React context providers
    utils/             # Utility functions
 server/                # Backend Express server
    src/
       routes/        # API route handlers
       utils/         # Server utilities
       types/         # TypeScript type definitions
    routes/            # Database connector routes
 electron/              # Electron desktop app
 dist/                  # Build output
`

##  Security

- Database credentials are encrypted before storage
- Environment variables are used for sensitive configuration
- Input validation and sanitization on all endpoints
- CORS protection for cross-origin requests
- No hardcoded secrets in the codebase

##  Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Troubleshooting

### Common Issues

**Chalk ES Module Error**
- This has been fixed by downgrading chalk to v4.1.2
- If you encounter this error, run: cd server && npm install chalk@4.1.2

**Database Connection Issues**
- Ensure your database server is running
- Check firewall settings
- Verify connection credentials
- Check if the database port is accessible

**Port Already in Use**
- The frontend runs on port 5174 by default
- The backend runs on port 3001 by default
- Change ports in ite.config.ts and server/.env if needed

##  Support

For support, please open an issue on GitHub or contact the development team.

---

**Dumpy** - Making database management and data import simple and efficient! 
