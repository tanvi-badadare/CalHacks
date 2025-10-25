# SocraticCode - AI Coding Tutor

SocraticCode is an AI-powered coding tutor that teaches programming through guided hints and step-by-step problem solving. Instead of giving you the answer directly, it provides hints at three different levels to help you learn and understand the solution process.

## Features

- **Three-Level Hint System**:
  - **Level 1**: Conceptual questions to guide your thinking
  - **Level 2**: Stepwise algorithmic instructions
  - **Level 3**: Detailed pseudocode with examples

- **Progressive Learning**: Hints unlock as you progress through levels
- **Session Tracking**: Your progress is saved as you work through problems
- **Multiple Programming Languages**: Support for JavaScript, Python, Java, C++, and more
- **Problem Categories**: Algorithms, Data Structures, Arrays, Strings, Math, etc.
- **Difficulty Levels**: Beginner, Intermediate, Advanced

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Styling**: CSS3 with modern design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CalHacks
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=4001
   MONGODB_URI=mongodb://localhost:27017/socraticcode
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # If using local MongoDB
   mongod
   
   # Or if using MongoDB Atlas, update the MONGODB_URI in .env
   ```

5. **Seed the database**
   ```bash
   cd server
   npm run seed
   ```

6. **Start the application**
   ```bash
   # From the root directory
   npm run dev
   
   # Or start them separately:
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm start
   ```

## Usage

1. **Browse Problems**: Visit `http://localhost:3000` to see available problems
2. **Filter Problems**: Use the filter options to find problems by difficulty, language, or category
3. **Start Learning**: Click "Start Problem" to begin working on a problem
4. **Request Hints**: Use the hint buttons to get guided help:
   - Start with Level 1 for conceptual guidance
   - Progress to Level 2 for algorithmic steps
   - Use Level 3 for detailed pseudocode
5. **Write Code**: Use the code editor to implement your solution
6. **Submit Solution**: Submit your code when ready

## API Endpoints

### Problems
- `GET /api/problems` - Get all problems (with optional filters)
- `GET /api/problems/:id` - Get a specific problem
- `POST /api/problems` - Create a new problem (admin)

### Hints
- `GET /api/hints/:problemId/:level` - Get hint for specific level
- `GET /api/hints/:problemId` - Get all hints for a problem

### Sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/:sessionId` - Get session details
- `PUT /api/sessions/:sessionId` - Update session (record hints, attempts)

## Project Structure

```
CalHacks/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── ...
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── ...
└── package.json           # Root package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Future Enhancements

- [ ] Code execution and testing
- [ ] User authentication and profiles
- [ ] Progress tracking and analytics
- [ ] More programming languages
- [ ] Mobile app version
- [ ] Collaborative problem solving
- [ ] AI-powered hint generation
