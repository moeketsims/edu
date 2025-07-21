# Student Academic Progress Dashboard

A modern React TypeScript application for tracking student academic progress, missing modules, and completion statistics.

## Features

- **📊 Real-time Analysis**: View comprehensive student progress analysis
- **🔍 Advanced Filtering**: Filter by academic level, plan code, completion percentage, and missing modules
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **⚡ Fast Performance**: Optimized for handling thousands of student records
- **🎯 Detailed Student View**: Expandable cards showing missing modules with priorities
- **📈 Bulk Analytics**: Overview statistics and distributions across all students

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000`

## Installation

1. **Clone and setup**:
   ```bash
   cd Frontend/student-analysis-dashboard
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser**: Navigate to `http://localhost:3000`

## Backend Configuration

The frontend expects the backend API to be running on `http://localhost:8000`. 

### Required Backend Endpoints:
- `GET /api/filter-options` - Get available filter options
- `POST /api/bulk-comprehensive-analysis` - Get bulk analysis data
- `GET /api/filtered-student-analysis` - Get filtered student results
- `GET /health` - Health check
- `GET /stats` - Database statistics

### CORS Configuration
Make sure your backend has CORS enabled for `http://localhost:3000`.

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard component
│   ├── StudentCard.tsx        # Individual student card
│   ├── BulkAnalysisCard.tsx   # Bulk analysis overview
│   └── FilterPanel.tsx        # Filter controls
├── services/
│   └── api.ts                 # API service layer
├── types/
│   └── index.ts               # TypeScript interfaces
├── App.tsx                    # Main app component
└── index.tsx                  # App entry point
```

## Key Components

### Dashboard
- Main application component
- Manages state for students, filters, and analysis data
- Handles pagination and loading states

### StudentCard
- Displays individual student information
- Expandable to show detailed missing modules
- Color-coded completion status and academic levels

### BulkAnalysisCard
- Shows overall statistics and distributions
- Academic level breakdown
- Most common missing modules
- Processing performance metrics

### FilterPanel
- Advanced filtering controls
- Real-time filter application
- Filter state management and clearing

## API Integration

The application uses axios for HTTP requests with the following structure:

```typescript
// API service examples
studentAnalysisAPI.bulkAnalysis(planCode?)
studentAnalysisAPI.filteredAnalysis(filters)
studentAnalysisAPI.getFilterOptions()
```

## Features in Detail

### 🎯 Student Filtering
- **Academic Level**: Filter by 1st, 2nd, 3rd, 4th year students
- **Plan Code**: Filter by specific degree programs
- **Missing Modules**: Show only students with/without missing modules
- **Completion Range**: Filter by completion percentage ranges

### 📊 Analysis Views
- **Completion Percentage**: Visual indicators with color coding
- **Missing Modules Count**: Quick overview of student needs
- **Academic Level Distribution**: See student spread across years
- **Retakes Tracking**: Identify students with module retakes

### 📱 Responsive Design
- Mobile-first approach with Tailwind CSS
- Collapsible filters on smaller screens
- Card-based layout that adapts to screen size
- Touch-friendly interactions

## Styling

Built with **Tailwind CSS** for:
- Consistent design system
- Responsive utilities
- Performance optimization
- Easy customization

### Color Scheme
- **Blue**: Primary actions and academic levels
- **Green**: Success states and completion
- **Yellow**: Warnings and moderate completion
- **Red**: Errors and low completion
- **Purple**: Advanced metrics and 4th year

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **API Endpoints**: Extend `src/services/api.ts`
3. **Types**: Update `src/types/index.ts`
4. **Styling**: Use Tailwind utility classes

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy the `build` folder** to your web server

3. **Configure API URL**: Update `API_BASE_URL` in `src/services/api.ts` for production

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend is running on port 8000
   - Check CORS configuration
   - Verify network connectivity

2. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS

3. **Performance Issues**
   - Reduce pagination limit
   - Clear browser cache
   - Check network tab for slow requests

### Error Handling

The application includes comprehensive error handling:
- Network request failures
- Invalid API responses
- Missing data graceful fallbacks
- User-friendly error messages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow TypeScript best practices
2. Use Tailwind for styling
3. Add proper error handling
4. Include loading states
5. Test on mobile devices

## License

This project is part of the Student Academic Progress Analysis System.
