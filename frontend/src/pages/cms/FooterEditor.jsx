import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCMSSection, saveCMSSection } from '../../services/cmsService';
import { Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import DualLanguageInput from '../../components/cms/editors/DualLanguageInput';

const FooterEditor = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        productDescription: { en: '', id: '' },
        supportEmail: '',
        githubUrl: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const content = await fetchCMSSection('footer');
                
                if (content) {
                    setFormData({
                        ...content,
                        productDescription: {
                            en: content.productDescription?.en || '',
                            id: content.productDescription?.id || ''
                        },
                        supportEmail: content.supportEmail || 'support@electricitymonitor.com',
                        githubUrl: content.githubUrl || 'https://github.com/ilhaminudin24/electricity-monitoring'
                    });
                } else {
                    setFormData({
                        productDescription: { en: '', id: '' },
                        supportEmail: 'support@electricitymonitor.com',
                        githubUrl: 'https://github.com/ilhaminudin24/electricity-monitoring'
                    });
                }
            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to load data' });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleLanguageChange = (lang, field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [lang]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const dataToSave = {
                ...formData,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser?.id,
                version: (formData.version || 0) + 1
            };

            // Use unified CMS service - automatically sets is_published=true
            await saveCMSSection('footer', dataToSave, currentUser?.id);

            setFormData(dataToSave);
            setMessage({
                type: 'success',
                text: 'Footer saved successfully!'
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Footer Section</h1>
                    <p className="text-slate-600 mt-1">Manage footer content</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save & Publish'}
                    </button>
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </a>
                </div>
            </div>

            {message.text && (
                <div className={`mb-8 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="mr-2 h-5 w-5" /> : <AlertCircle className="mr-2 h-5 w-5" />}
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                {/* Product Description */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-xl font-semibold mb-6">Product Information</h2>
                    <DualLanguageInput
                        label="Product Description"
                        valueEN={formData.productDescription?.en || ''}
                        valueID={formData.productDescription?.id || ''}
                        onChange={(lang, value) => handleLanguageChange(lang, 'productDescription', value)}
                        multiline
                    />
                </div>

                {/* Links */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-xl font-semibold mb-6">Links & Contacts</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Support Email
                            </label>
                            <input
                                type="email"
                                value={formData.supportEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, supportEmail: e.target.value }))}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                GitHub URL
                            </label>
                            <input
                                type="url"
                                value={formData.githubUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FooterEditor;
