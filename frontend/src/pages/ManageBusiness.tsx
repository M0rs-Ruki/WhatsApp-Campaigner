import { useState, useEffect, useCallback } from 'react';
import type { FormEvent, ChangeEvent  } from 'react';

interface BusinessData {
  companyName: string;
  email: string;
  number: string;
  image?: string;
}

const ManageBusiness = () => {
  // ✅ NEW: Store original data separately
  const [originalData, setOriginalData] = useState<BusinessData>({
    companyName: '',
    email: '',
    number: '',
  });

  const [formData, setFormData] = useState<BusinessData>({
    companyName: '',
    email: '',
    number: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL;

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
        const data = {
          companyName: result.data.companyName || '',
          email: result.data.email || '',
          number: result.data.number || '',
          image: result.data.image || '',
        };

        // ✅ Store both original and form data
        setOriginalData(data);
        setFormData(data);

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
    setError('');
  };

  // Handle password input changes
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError('');
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

  // ✅ FIXED: Handle form submission (ONLY send changed fields)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const userId = getUserId();
    if (!userId) {
      setError('User not found. Please login again.');
      return;
    }

    // ✅ NEW: Build update object with ONLY changed fields
    const profileUpdates: Partial<BusinessData> = {};
    
    if (formData.companyName !== originalData.companyName && formData.companyName.trim()) {
      profileUpdates.companyName = formData.companyName;
    }
    if (formData.email !== originalData.email && formData.email.trim()) {
      profileUpdates.email = formData.email;
    }
    if (formData.number !== originalData.number && formData.number.trim()) {
      profileUpdates.number = formData.number;
    }

    const hasProfileUpdate = Object.keys(profileUpdates).length > 0 || selectedImage;
    const hasPasswordUpdate = passwordData.newPassword || passwordData.confirmPassword;

    if (!hasProfileUpdate && !hasPasswordUpdate) {
      setError('No changes detected. Please modify at least one field.');
      return;
    }

    // Validate email if changed
    if (profileUpdates.email && !isValidEmail(profileUpdates.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone if changed
    if (profileUpdates.number && !isValidPhoneNumber(profileUpdates.number)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate password fields if provided
    if (hasPasswordUpdate) {
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setError('Please fill in both password fields');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 5) {
        setError('Password must be at least 5 characters long');
        return;
      }
    }

    setLoading(true);

    try {
      let profileUpdateSuccess = false;
      let passwordUpdateSuccess = false;

      // ✅ FIXED: Update profile with ONLY changed fields
      if (hasProfileUpdate) {
        const profileFormData = new FormData();

        // ✅ Only append changed fields
        if (profileUpdates.companyName) profileFormData.append('companyName', profileUpdates.companyName);
        if (profileUpdates.email) profileFormData.append('email', profileUpdates.email);
        if (profileUpdates.number) profileFormData.append('number', profileUpdates.number);
        if (selectedImage) profileFormData.append('image', selectedImage);

        const profileResponse = await fetch(`${API_URL}/api/auth/update-profile`, {
          method: 'PUT',
          credentials: 'include',
          body: profileFormData,
        });

        const profileResult = await profileResponse.json();

        if (profileResponse.ok && profileResult.success) {
          profileUpdateSuccess = true;

          // Update localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            const updatedUser = {
              ...user,
              companyName: profileResult.user.companyName,
              email: profileResult.user.email,
              number: profileResult.user.number,
              image: profileResult.user.image,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }

          // ✅ Update original data to new values
          setOriginalData({
            companyName: profileResult.user.companyName,
            email: profileResult.user.email,
            number: profileResult.user.number,
            image: profileResult.user.image,
          });

          setFormData({
            companyName: profileResult.user.companyName,
            email: profileResult.user.email,
            number: profileResult.user.number,
            image: profileResult.user.image,
          });

          // Update preview URL
          if (profileResult.user.image) {
            setPreviewUrl(profileResult.user.image);
          }

          setSelectedImage(null);
        } else {
          setError(profileResult.message || 'Failed to update profile');
          setLoading(false);
          return;
        }
      }

      // Update password if fields are provided
      if (hasPasswordUpdate) {
        const passwordResponse = await fetch(`${API_URL}/api/user/change-own-password`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newPassword: passwordData.newPassword,
            confirmPassword: passwordData.confirmPassword
          }),
        });

        const passwordResult = await passwordResponse.json();

        if (passwordResponse.ok && passwordResult.success) {
          passwordUpdateSuccess = true;
          setPasswordData({ newPassword: '', confirmPassword: '' });
        } else {
          setError(passwordResult.message || 'Failed to change password');
          setLoading(false);
          return;
        }
      }

      // ✅ Better success messages
      const changedFields = [];
      if (profileUpdates.companyName) changedFields.push('company name');
      if (profileUpdates.email) changedFields.push('email');
      if (profileUpdates.number) changedFields.push('phone number');
      if (selectedImage) changedFields.push('profile image');

      if (profileUpdateSuccess && passwordUpdateSuccess) {
        setSuccess(`${changedFields.join(', ')} and password updated successfully!`);
      } else if (profileUpdateSuccess) {
        setSuccess(`${changedFields.join(', ')} updated successfully!`);
      } else if (passwordUpdateSuccess) {
        setSuccess('Password changed successfully!');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(''), 5000);

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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Page Header */}
      <div className="p-4 sm:p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-black">Update Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Update your profile information, image, and change password</p>
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
        
        {/* Profile Information Section */}
        <div className="p-4 sm:p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-4">Profile Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-bold text-black mb-2 uppercase">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder={`Current: ${originalData.companyName || 'Not set'}`}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                disabled={loading}
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-2 uppercase">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={`Current: ${originalData.email || 'Not set'}`}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                disabled={loading}
              />
            </div>

            {/* Business Contact */}
            <div>
              <label htmlFor="number" className="block text-sm font-bold text-black mb-2 uppercase">
                Business Contact
              </label>
              <div className="flex gap-2">
                <div className="px-3 sm:px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black font-semibold text-sm sm:text-base">
                  +91
                </div>
                <input
                  type="tel"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  placeholder={`Current: ${originalData.number || 'Not set'}`}
                  maxLength={10}
                  className="flex-1 px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-black opacity-60 mt-2">* Enter 10-digit mobile number without country code</p>
            </div>

            {/* Business Logo */}
            <div>
              <label htmlFor="image" className="block text-sm font-bold text-black mb-2 uppercase">
                Business Logo
              </label>
              
              {previewUrl && (
                <div className="mb-4">
                  <img 
                    src={previewUrl} 
                    alt="Business Logo Preview" 
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border-2 border-green-500 shadow-lg"
                  />
                </div>
              )}

              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-green-600 transition-all"
              />
              <p className="text-xs text-black opacity-60 mt-2">* Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="p-4 sm:p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-2">Change Password</h3>
          <p className="text-sm text-gray-600 mb-4">Leave blank if you don't want to change your password</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold text-black mb-2 uppercase">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password (min 5 characters)"
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-black mb-2 uppercase">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Requirements */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
            <p className="text-xs text-gray-700">
              <span className="font-bold">Password Requirements:</span><br />
              • Minimum 5 characters<br />
              • Both passwords must match
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-green-500/80 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageBusiness;
  