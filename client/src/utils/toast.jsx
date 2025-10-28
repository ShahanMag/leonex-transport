import { toast } from 'sonner';

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message);
};

export const showInfo = (message) => {
  toast.info(message);
};

export const showWarning = (message) => {
  toast.warning(message);
};

export const showConfirm = (message, onConfirm) => {
  toast.custom((t) => (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <p className="text-gray-800 mb-4">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => toast.dismiss(t)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            toast.dismiss(t);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  ));
};
