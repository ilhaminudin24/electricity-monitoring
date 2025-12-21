import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { setAdminRole, setupInitialCMSData } from '../utils/cms/setupCMSData';
import { CheckCircle, AlertCircle, Shield, Database } from 'lucide-react';

const CMSSetup = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSetAdmin = async () => {
        if (!currentUser) {
            setMessage({ type: 'error', text: 'You must be logged in' });
            return;
        }

        try {
            setLoading(true);
            setMessage({ type: '', text: '' });

            const result = await setAdminRole(currentUser.uid);

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: `Successfully set admin role for ${currentUser.email}. Please refresh the page.`
                });
            } else {
                setMessage({ type: 'error', text: 'Failed to set admin role' });
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSetupCMS = async () => {
        if (!currentUser) {
            setMessage({ type: 'error', text: 'You must be logged in' });
            return;
        }

        try {
            setLoading(true);
            setMessage({ type: '', text: '' });

            const result = await setupInitialCMSData(currentUser.uid);

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: 'CMS data initialized successfully! You can now access /cms/dashboard'
                });
            } else {
                setMessage({ type: 'error', text: 'Failed to setup CMS data' });
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Shield className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">CMS Setup</h1>
                        <p className="text-slate-600">Initialize CMS and set admin role</p>
                    </div>

                    {/* Current User Info */}
                    {currentUser && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600">Current User:</p>
                            <p className="font-medium text-slate-900">{currentUser.email}</p>
                            <p className="text-xs text-slate-500 mt-1">UID: {currentUser.uid}</p>
                        </div>
                    )}

                    {/* Message */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg flex items-start ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                            )}
                            <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                                {message.text}
                            </span>
                        </div>
                    )}

                    {/* Setup Steps */}
                    <div className="space-y-4">
                        {/* Step 1: Set Admin Role */}
                        <div className="border border-slate-200 rounded-lg p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-2">
                                        Step 1: Set Admin Role
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Grant admin access to your account to access the CMS dashboard
                                    </p>
                                </div>
                                <span className="text-2xl font-bold text-slate-300">1</span>
                            </div>
                            <button
                                onClick={handleSetAdmin}
                                disabled={loading || !currentUser}
                                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                <Shield className="h-5 w-5 mr-2" />
                                {loading ? 'Setting...' : 'Set Admin Role'}
                            </button>
                        </div>

                        {/* Step 2: Initialize CMS Data */}
                        <div className="border border-slate-200 rounded-lg p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-2">
                                        Step 2: Initialize CMS Data
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        ⚠️ Requires Supabase migration (previously used Firestore)
                                    </p>
                                </div>
                                <span className="text-2xl font-bold text-slate-300">2</span>
                            </div>
                            <button
                                onClick={handleSetupCMS}
                                disabled={loading || !currentUser}
                                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                <Database className="h-5 w-5 mr-2" />
                                {loading ? 'Initializing...' : 'Initialize CMS Data'}
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Click "Set Admin Role" to grant yourself admin access</li>
                            <li>Click "Initialize CMS Data" to populate initial content</li>
                            <li>Refresh the page after both steps complete</li>
                            <li>Navigate to <code className="bg-blue-100 px-1 rounded">/cms/dashboard</code></li>
                        </ol>
                    </div>

                    {/* Manual Alternative */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-sm text-slate-600 text-center">
                            ⚠️ CMS functionality requires Supabase migration.{' '}
                            <a
                                href="https://supabase.com/dashboard"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Supabase Dashboard
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CMSSetup;
