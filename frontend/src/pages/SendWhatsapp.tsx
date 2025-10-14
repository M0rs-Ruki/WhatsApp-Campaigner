import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import type { FormEvent, ChangeEvent } from 'react';
import 'react-quill-new/dist/quill.snow.css';

interface FormData {
  campaignName: string;
  message: string;
  phoneButtonText: string;
  phoneButtonNumber: string;
  linkButtonText: string;
  linkButtonUrl: string;
  mobileNumberEntryType: string;
  mobileNumbers: string;
  countryCode: string;
  numberCount: string;
}

const SendWhatsapp = () => {
  const [formData, setFormData] = useState<FormData>({
    campaignName: '',
    message: '',
    phoneButtonText: '',
    phoneButtonNumber: '',
    linkButtonText: '',
    linkButtonUrl: '',
    mobileNumberEntryType: 'manual',
    mobileNumbers: '',
    countryCode: '+91',
    numberCount: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'pdf' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Rich text editor configuration
  const modules = {
    toolbar: [
      ['bold', 'italic'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote'],
      ['link']
    ],
  };

  const formats = [
    "bold",
    "italic",
    "list", 
    "blockquote",
    "link",
  ];
  

  // Handle text input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle rich text editor change
  const handleMessageChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      message: content
    }));
  };

  // Handle file upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit');
      return;
    }

    // Validate file type
    const validTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
      video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
      pdf: ['application/pdf']
    };

    if (!validTypes[type].includes(file.type)) {
      setError(`Invalid ${type} file type`);
      return;
    }

    // Clear previous file if different type is selected
    setSelectedFile(file);
    setFileType(type);
    setError('');
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFileType(null);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.campaignName || !formData.message || !formData.mobileNumbers) {
      setError('Campaign name, message, and mobile numbers are required');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      
      // Append form fields
      submitData.append('campaignName', formData.campaignName);
      submitData.append('message', formData.message);
      submitData.append('mobileNumberEntryType', formData.mobileNumberEntryType);
      submitData.append('mobileNumbers', formData.mobileNumbers);
      submitData.append('countryCode', formData.countryCode);

      // Append optional fields
      if (formData.phoneButtonText && formData.phoneButtonNumber) {
        submitData.append('phoneButtonText', formData.phoneButtonText);
        submitData.append('phoneButtonNumber', formData.phoneButtonNumber);
      }

      if (formData.linkButtonText && formData.linkButtonUrl) {
        submitData.append('linkButtonText', formData.linkButtonText);
        submitData.append('linkButtonUrl', formData.linkButtonUrl);
      }

      // Append file if selected
      if (selectedFile) {
        submitData.append('image', selectedFile);
      }

      // Send to backend
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        body: submitData,
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Campaign created successfully!');
        // Reset form
        setFormData({
          campaignName: '',
          message: '',
          phoneButtonText: '',
          phoneButtonNumber: '',
          linkButtonText: '',
          linkButtonUrl: '',
          mobileNumberEntryType: 'manual',
          mobileNumbers: '',
          countryCode: '+91',
          numberCount: ''
        });
        setSelectedFile(null);
        setFileType(null);
      } else {
        setError(result.message || 'Failed to create campaign');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <h2 className="text-3xl font-bold text-black">SEND NEW Campaign</h2>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-500/30 backdrop-blur-md rounded-xl border border-white/50 shadow-lg">
          <p className="text-black font-semibold">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Campaign Name */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-2 uppercase">
            Campaign Name *
          </label>
          <input
            type="text"
            name="campaignName"
            value={formData.campaignName}
            onChange={handleInputChange}
            placeholder="Enter campaign name"
            className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            disabled={loading}
          />
        </div>

        {/* Message - Rich Text Editor */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-2 uppercase">
            Message *
          </label>
          <div className="bg-white/80 rounded-xl overflow-hidden">
            <ReactQuill
              theme="snow"
              value={formData.message}
              onChange={handleMessageChange}
              modules={modules}
              formats={formats}
              placeholder="Enter your message..."
              className="text-black"
            />
          </div>
        </div>

        {/* Phone Button */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-4 uppercase">
            Phone number on Button :
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="phoneButtonText"
              value={formData.phoneButtonText}
              onChange={handleInputChange}
              placeholder="Call us"
              className="px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
            <input
              type="tel"
              name="phoneButtonNumber"
              value={formData.phoneButtonNumber}
              onChange={handleInputChange}
              placeholder="Phone Number"
              className="px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Link Button */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-4 uppercase">
            Link on Button :
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="linkButtonText"
              value={formData.linkButtonText}
              onChange={handleInputChange}
              placeholder="Visit us"
              className="px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
            <input
              type="url"
              name="linkButtonUrl"
              value={formData.linkButtonUrl}
              onChange={handleInputChange}
              placeholder="URL"
              className="px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* File Uploads - Only ONE can be selected */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-4 uppercase">
            Upload Media (Select Only One) <span className="text-red-600">(MAX FILE SIZE 5MB)</span>
          </label>
          
          {selectedFile && (
            <div className="mb-4 p-3 bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-300 flex items-center justify-between">
              <span className="text-black font-semibold">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="px-4 py-2 bg-red-500/60 backdrop-blur-md text-white font-semibold rounded-lg hover:bg-red-600/60 transition-all"
              >
                Remove
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-black mb-2">IMAGE</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
                disabled={loading || (selectedFile !== null && fileType !== 'image')}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500/60 file:text-white file:font-semibold hover:file:bg-green-600/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-xs font-bold text-black mb-2">VIDEO</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, 'video')}
                disabled={loading || (selectedFile !== null && fileType !== 'video')}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500/60 file:text-white file:font-semibold hover:file:bg-green-600/60 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* PDF Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-black mb-2">
                UPLOAD PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileUpload(e, 'pdf')}
                disabled={loading || (selectedFile !== null && fileType !== 'pdf')}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500/60 file:text-white file:font-semibold hover:file:bg-green-600/60 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Mobile Number Entry Type */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-2 uppercase">
            Mobile Number Enter Type *
          </label>
          <select
            name="mobileNumberEntryType"
            value={formData.mobileNumberEntryType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            disabled={loading}
          >
            <option value="Manual Entry">Manual Entry</option>
            <option value="CSV Upload">CSV Upload</option>
            <option value="Contact List">Contact List</option>
          </select>
        </div>

        {/* Mobile Numbers */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-2 uppercase">
            Mobile Numbers *
          </label>
          <textarea
            name="mobileNumbers"
            value={formData.mobileNumbers}
            onChange={handleInputChange}
            placeholder="Enter mobile numbers (comma-separated)"
            rows={5}
            className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
            disabled={loading}
          />
        </div>

        {/* Number Count */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <label className="block text-sm font-bold text-black mb-2 uppercase">
            Number Count *
          </label>
          <input
            type="text"
            name="numberCount"
            value={formData.numberCount}
            onChange={handleInputChange}
            placeholder="Enter number count"
            className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-4 bg-green-500/80 backdrop-blur-md text-white font-bold text-lg rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendWhatsapp;
