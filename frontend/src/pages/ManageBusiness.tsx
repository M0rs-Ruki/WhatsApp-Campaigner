import { useState, useEffect, useCallback } from 'react';
import type { FormEvent, ChangeEvent  } from 'react';

interface BusinessData {
  companyName: string;
  email: string;
  number: string;
  image?: string;
}

const ManageBusiness = () => {
  const [formData, setFormData] = useState<BusinessData>({
    companyName: '',
    email: '',
    number: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Get userId from localStorage
  const getUserId = (): string | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return user._id;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  // Fetch business details on page load
  const fetchBusinessDetails = useCallback(async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/manage-business`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormData({
          companyName: result.data.companyName || '',
          email: result.data.email || '',
          number: result.data.number || '',
          image: result.data.image || '',
        });

        // Set preview if image exists
        if (result.data.image) {
          setPreviewUrl(result.data.image);
        }
      } else {
        setError(result.message || 'Failed to load business details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setFetchLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchBusinessDetails();
  }, [fetchBusinessDetails]);

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear errors when user types
  };

  // Handle file selection (for future use)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone number validation (10 digits)
  const isValidPhoneNumber = (number: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(number);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.email && !isValidEmail(formData.email)) {
      setError('Please enter a valid email address (e.g., example@gmail.com)');
      return;
    }

    if (formData.number && !isValidPhoneNumber(formData.number)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Check if at least one field is filled
    if (!formData.companyName && !formData.email && !formData.number) {
      setError('Please provide at least one field to update');
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError('User not found. Please login again.');
      return;
    }

    setLoading(true);

    try {
      // Prepare update data - only send fields that have values
      const updateData: Partial<BusinessData> = {};
      if (formData.companyName) updateData.companyName = formData.companyName;
      if (formData.email) updateData.email = formData.email;
      if (formData.number) updateData.number = formData.number;

      const response = await fetch(`${API_URL}/api/user/update/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(result.message || 'Profile updated successfully!');

        // Update localStorage with new user data
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const updatedUser = {
            ...user,
            companyName: result.data.companyName,
            email: result.data.email,
            number: result.data.number,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <h2 className="text-3xl font-bold text-black">Update Profile</h2>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-500/30 backdrop-blur-md rounded-xl border border-white/50 shadow-lg animate-fade-in">
          <p className="text-black font-semibold">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg animate-fade-in">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Company Name */}
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
            <label htmlFor="companyName" className="block text-sm font-bold text-black mb-2 uppercase">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Enter company name"
              className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
          </div>

          {/* Email Address */}
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
            <label htmlFor="email" className="block text-sm font-bold text-black mb-2 uppercase">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
          </div>

          {/* Business Contact */}
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
            <label htmlFor="number" className="block text-sm font-bold text-black mb-2 uppercase">
              Business Contact
            </label>
            <div className="flex gap-2">
              <div className="px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black font-semibold">
                +91
              </div>
              <input
                type="tel"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                placeholder="Enter 10-digit number"
                maxLength={10}
                className="flex-1 px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-black opacity-60 mt-2">* Enter 10-digit mobile number without country code</p>
          </div>

          {/* Business Logo (Disabled for now) */}
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl opacity-60">
            <label htmlFor="image" className="block text-sm font-bold text-black mb-2 uppercase">
              Business Logo
            </label>
            
            {previewUrl && (
              <div className="mb-4">
                <img 
                  src={previewUrl} 
                  alt="Business Logo Preview" 
                  className="w-24 h-24 object-cover rounded-lg border-2 border-white/80"
                />
              </div>
            )}

            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              disabled={true}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border-2 border-white/50 rounded-xl text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-400 file:text-white file:font-semibold cursor-not-allowed"
            />
            <p className="text-xs text-black opacity-60 mt-2">* Image upload feature coming soon</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-4 bg-green-500/80 backdrop-blur-md text-white font-bold text-lg rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageBusiness;
