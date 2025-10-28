# Vehicle Rental System - Frontend

A modern, responsive React application built with Vite and Tailwind CSS for managing vehicle rentals, companies, drivers, and payments.

## Technology Stack

- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router v7.9.4
- **Styling**: Tailwind CSS 3.4.18
- **HTTP Client**: Axios 1.6.2
- **Node Version**: v14+

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx       # Button component
│   │   ├── Input.jsx        # Input field component
│   │   ├── Modal.jsx        # Modal dialog component
│   │   ├── Table.jsx        # Data table component
│   │   ├── Form.jsx         # Generic form component
│   │   └── Navigation.jsx   # Navigation header
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx    # Dashboard with stats
│   │   ├── Companies.jsx    # Companies management
│   │   ├── Vehicles.jsx     # Vehicles management
│   │   ├── Drivers.jsx      # Drivers management
│   │   ├── Loads.jsx        # Rental requests management
│   │   ├── Payments.jsx     # Payments management
│   │   └── Reports.jsx      # Reports and analytics
│   ├── services/            # API communication
│   │   └── api.js           # Axios API configuration
│   ├── utils/               # Utility functions
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Installation

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- Backend server running on `http://localhost:5000`

### Setup Steps

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (optional):**
   The API base URL is configured in `src/services/api.js`. Update if needed:
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
The application will start on `http://localhost:5173` (or another available port).

### Production Build
```bash
npm run build
```
Creates an optimized production build in the `dist` folder.

### Preview Production Build
```bash
npm run preview
```

## Features Implemented

### Pages & Routes

| Route | Component | Features |
|-------|-----------|----------|
| `/` | Dashboard | Overview stats, quick start guide |
| `/companies` | Companies | List, add, edit, delete companies |
| `/vehicles` | Vehicles | Manage vehicle inventory with company association |
| `/drivers` | Drivers | Register, manage, view driver details |
| `/loads` | Loads | Create rental requests, assign drivers |
| `/payments` | Payments | Record and track payments |
| `/reports` | Reports | View 4 different reports with analytics |

### Reusable Components

- **Button** - Styled button with variants (primary, secondary, success, danger, outline)
- **Input** - Text input with label, error handling, and validation
- **Modal** - Dialog for forms and content display
- **Table** - Data table with sortable columns and action buttons
- **Form** - Generic form builder supporting text, select, and textarea fields
- **Navigation** - Responsive navigation bar with mobile menu

### API Services

All API calls are centralized in `src/services/api.js`:

```javascript
// Company APIs
companyAPI.getAll()
companyAPI.getById(id)
companyAPI.create(data)
companyAPI.update(id, data)
companyAPI.delete(id)

// Similar APIs for:
// - vehicleAPI
// - driverAPI
// - loadAPI
// - paymentAPI
// - reportAPI
```

### Reports Available

1. **Balance Report** - Shows pending payments per entity
2. **Payment History** - Complete transaction history
3. **Vehicle Utilization** - Vehicle availability and usage rates
4. **Driver Performance** - Driver statistics and earnings

## Component Showcase

### Button Component
```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

### Modal Component
```jsx
<Modal
  isOpen={isFormOpen}
  onClose={handleClose}
  title="Add Company"
  size="md"
>
  {/* Modal content */}
</Modal>
```

### Table Component
```jsx
<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ]}
  data={companies}
  actions={[
    { label: 'Edit', onClick: handleEdit }
  ]}
/>
```

### Form Component
```jsx
<Form
  fields={[
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'status', label: 'Status', type: 'select',
      options: [...] }
  ]}
  values={formValues}
  onChange={handleChange}
  onSubmit={handleSubmit}
/>
```

## Styling

- **Framework**: Tailwind CSS
- **Responsive**: Mobile-first approach
- **Color Scheme**: Blue primary, with green, yellow, and red accents
- **Typography**: System fonts with Tailwind defaults

## Key Features

✅ Full CRUD operations for all entities
✅ Real-time data fetching from backend
✅ Modal-based forms for adding/editing
✅ Responsive design (mobile, tablet, desktop)
✅ Data tables with action buttons
✅ Comprehensive reports and analytics
✅ Error handling and user feedback
✅ Clean, modular component architecture
✅ Centralized API management
✅ Navigation with mobile menu

## API Communication

All API calls use Axios with automatic error handling:

```javascript
try {
  const response = await vehicleAPI.getAll();
  setVehicles(response.data);
} catch (error) {
  alert('Failed to fetch vehicles');
}
```

### Expected Backend URL
```
http://localhost:5000/api
```

Make sure the backend server is running before starting the frontend.

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Host
The `dist` folder contains the production-ready files. Deploy to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Any static hosting service

### Environment Variables
Create a `.env` file for production API URL:
```
VITE_API_BASE_URL=https://your-api-url.com
```

Update `src/services/api.js` to use the environment variable:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

## Troubleshooting

### Port Already in Use
If port 5173 is in use:
```bash
npm run dev -- --port 3000
```

### CORS Issues
Ensure the backend has CORS enabled for your frontend URL.

### API Connection Failed
1. Check if backend is running on `http://localhost:5000`
2. Verify API base URL in `src/services/api.js`
3. Check network tab in browser DevTools

## Future Enhancements

- [ ] Authentication & Authorization (JWT)
- [ ] State management (Redux/Zustand)
- [ ] Advanced filters and search
- [ ] Export to CSV/PDF
- [ ] Real-time notifications
- [ ] Charts and graphs for analytics
- [ ] Image upload for documents
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Unit and integration tests

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC

## Notes

- All API endpoints follow REST conventions
- Component styling uses Tailwind CSS classes
- Forms include client-side validation feedback
- Modal dialogs prevent body scroll when open
- Tables are fully responsive on mobile devices
- Navigation menu collapses on mobile screens

## Getting Help

Refer to:
- Backend API documentation: `/server/docs/API_DOCUMENTATION.md`
- Requirements: `/server/docs/REQUIREMENTS.md`
- Development tasks: `/server/docs/DEVELOPMENT_TASKS.md`
