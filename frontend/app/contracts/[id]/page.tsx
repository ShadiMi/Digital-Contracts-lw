'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface Contract {
  id: number;
  title: string;
  file_name: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  locked_by_id: number | null;
  locked_at: string | null;
  sender: { id: number; username: string; full_name: string | null };
  recipient: { id: number; username: string; full_name: string | null };
  versions: Array<{
    id: number;
    version_number: number;
    file_name: string;
    created_at: string;
    created_by: { username: string };
    change_notes: string | null;
  }>;
}

export default function ContractDetail() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [changeNotes, setChangeNotes] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchContract();
    fetchCurrentUser();
  }, [contractId, router]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchContract = async () => {
    try {
      const response = await api.get(`/api/contracts/${contractId}`);
      setContract(response.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/contracts/${contractId}/sign`);
      await fetchContract();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to sign contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!confirm('Are you sure you want to deny this contract?')) return;

    setActionLoading(true);
    try {
      await api.post(`/api/contracts/${contractId}/deny`);
      await fetchContract();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to deny contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async (action: 'lock' | 'unlock') => {
    setActionLoading(true);
    try {
      await api.post(`/api/contracts/${contractId}/lock`, { action });
      await fetchContract();
    } catch (error: any) {
      alert(error.response?.data?.detail || `Failed to ${action} contract`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFile) {
      alert('Please select a file');
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', editFile);
      if (changeNotes) {
        formData.append('change_notes', changeNotes);
      }

      // Lock the contract first
      await api.post(`/api/contracts/${contractId}/lock`, { action: 'lock' });

      // Upload edited version
      await api.post(`/api/contracts/${contractId}/edit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchContract();
      setIsEditing(false);
      setEditFile(null);
      setChangeNotes('');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to edit contract');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadContract = async () => {
    try {
      const response = await api.get(`/api/contracts/${contractId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', contract?.file_name || 'contract.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download contract');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Contract not found'}</div>
      </div>
    );
  }

  const isRecipient = currentUser?.id === contract.recipient.id;
  const isSender = currentUser?.id === contract.sender.id;
  const isLocked = contract.locked_by_id !== null;
  const isLockedByMe = contract.locked_by_id === currentUser?.id;
  const canEdit = (isRecipient || isSender) && contract.status !== 'signed' && contract.status !== 'denied';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{contract.title}</h1>
            <p className="text-gray-600">File: {contract.file_name}</p>
            <div className="mt-4 flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  contract.status === 'signed'
                    ? 'bg-green-100 text-green-800'
                    : contract.status === 'denied'
                    ? 'bg-red-100 text-red-800'
                    : contract.status === 'edited'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {contract.status}
              </span>
              {isLocked && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                  🔒 {isLockedByMe ? 'Locked by you' : 'Locked by another user'}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Sender</p>
              <p className="font-medium">{contract.sender.full_name || contract.sender.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Recipient</p>
              <p className="font-medium">{contract.recipient.full_name || contract.recipient.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date(contract.created_at).toLocaleString()}</p>
            </div>
            {contract.signed_at && (
              <div>
                <p className="text-sm text-gray-500">Signed</p>
                <p className="font-medium">{new Date(contract.signed_at).toLocaleString()}</p>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-4">
              <button
                onClick={downloadContract}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                Download Contract
              </button>

              {canEdit && (
                <div className="flex space-x-4">
                  {!isLockedByMe && (
                    <button
                      onClick={() => handleLock('lock')}
                      disabled={actionLoading || isLocked}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Lock for Editing
                    </button>
                  )}
                  {isLockedByMe && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={actionLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit Contract
                      </button>
                      <button
                        onClick={() => handleLock('unlock')}
                        disabled={actionLoading}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Unlock
                      </button>
                    </>
                  )}
                </div>
              )}

              {isRecipient && contract.status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleSign}
                    disabled={actionLoading || isLocked}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sign Contract
                  </button>
                  <button
                    onClick={handleDeny}
                    disabled={actionLoading || isLocked}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deny Contract
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="editFile" className="block text-sm font-medium text-gray-700">
                  Upload Edited Contract *
                </label>
                <input
                  type="file"
                  id="editFile"
                  required
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label htmlFor="changeNotes" className="block text-sm font-medium text-gray-700">
                  Change Notes (Optional)
                </label>
                <textarea
                  id="changeNotes"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditFile(null);
                    setChangeNotes('');
                  }}
                  disabled={actionLoading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {contract.versions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Version History</h2>
              <div className="space-y-2">
                {contract.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">Version {version.version_number}</p>
                      <p className="text-sm text-gray-600">
                        {version.created_by.username} - {new Date(version.created_at).toLocaleString()}
                      </p>
                      {version.change_notes && (
                        <p className="text-sm text-gray-500 mt-1">{version.change_notes}</p>
                      )}
                    </div>
                    <a
                      href={`/api/contracts/${contractId}/versions/${version.id}/download`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          const response = await api.get(
                            `/api/contracts/${contractId}/versions/${version.id}/download`,
                            { responseType: 'blob' }
                          );
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', version.file_name);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (error) {
                          alert('Failed to download version');
                        }
                      }}
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


