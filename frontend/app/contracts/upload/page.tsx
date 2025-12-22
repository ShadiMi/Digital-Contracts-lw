'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export default function UploadContract() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    recipient_username: '',
    recipient_email: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!formData.recipient_username && !formData.recipient_email) {
      setError('Please provide either recipient username or email');
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title);
      if (formData.recipient_username) {
        uploadData.append('recipient_username', formData.recipient_username);
      }
      if (formData.recipient_email) {
        uploadData.append('recipient_email', formData.recipient_email);
      }
      if (formData.notes) {
        uploadData.append('notes', formData.notes);
      }

      await api.post('/api/contracts/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      router.push('/contracts');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload New Contract</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Contract Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                Contract File *
              </label>
              <input
                type="file"
                id="file"
                required
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label htmlFor="recipient_username" className="block text-sm font-medium text-gray-700">
                Recipient Username
              </label>
              <input
                type="text"
                id="recipient_username"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.recipient_username}
                onChange={(e) => setFormData({ ...formData, recipient_username: e.target.value })}
                placeholder="Enter recipient username"
              />
              <p className="mt-1 text-sm text-gray-500">Or use email below</p>
            </div>

            <div>
              <label htmlFor="recipient_email" className="block text-sm font-medium text-gray-700">
                Recipient Email
              </label>
              <input
                type="email"
                id="recipient_email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.recipient_email}
                onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                placeholder="Enter recipient email"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/contracts')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Contract'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


