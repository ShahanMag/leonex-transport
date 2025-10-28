import Input from './Input';
import Button from './Button';

export default function Form({
  fields,
  values,
  errors,
  onChange,
  onSubmit,
  isLoading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {fields.map((field) => {
        if (field.type === 'select') {
          return (
            <div key={field.name} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                name={field.name}
                value={values[field.name] || ''}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Select {field.label} --</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors[field.name] && (
                <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
              )}
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.name} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                name={field.name}
                value={values[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                disabled={isLoading}
                rows={field.rows || 4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors[field.name] && (
                <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
              )}
            </div>
          );
        }

        return (
          <Input
            key={field.name}
            label={field.label}
            type={field.type || 'text'}
            name={field.name}
            placeholder={field.placeholder}
            value={values[field.name] || ''}
            onChange={handleChange}
            error={errors[field.name]}
            required={field.required}
            disabled={isLoading}
          />
        );
      })}

      <div className="flex gap-3 mt-6">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : submitText}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        )}
      </div>
    </form>
  );
}
