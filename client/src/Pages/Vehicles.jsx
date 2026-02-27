import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

export default function Vehicles() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-8 rounded-lg">
          <h1 className="text-3xl font-bold text-amber-900 mb-4">Vehicle Management Deprecated</h1>

          <p className="text-amber-800 text-lg mb-6">
            The standalone Vehicle management page has been deprecated as part of the system refactoring.
          </p>

          <div className="bg-white p-6 rounded-lg mb-6 border border-amber-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What Changed?</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-amber-500 mr-3 font-bold">•</span>
                <span>Vehicles are no longer tracked as separate entities in the database</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-3 font-bold">•</span>
                <span>Vehicle information is now stored with payment and load records</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-3 font-bold">•</span>
                <span>Vehicle Details is handled as part of the unified rental transaction</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">New Workflow</h2>
            <p className="text-gray-700 mb-4">
              Use the <strong>New Rental</strong> feature to create a complete rental transaction in one step:
            </p>
            <ol className="space-y-2 text-gray-700 ml-4">
              <li>1. Select or create a company</li>
              <li>2. Select or create a driver</li>
              <li>3. Specify vehicle type and acquisition details</li>
              <li>4. Define load and rental details</li>
              <li>5. Submit to create everything at once</li>
            </ol>
          </div>

          <div className="flex gap-4">
            <Button
              variant="success"
              onClick={() => navigate('/rental-transaction')}
              className="flex-1"
            >
              Go to New Rental Transaction
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-sm text-amber-700 mt-6 p-4 bg-amber-100 rounded">
            <strong>Note:</strong> This page is kept for reference. All vehicle data is now managed through rental transactions and can be viewed in the Rentals and Payments pages.
          </p>
        </div>
      </div>
    </div>
  );
}
