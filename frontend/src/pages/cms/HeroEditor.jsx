import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCMSSection, saveCMSSection } from '../../services/cmsService';
import { Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import DualLanguageInput from '../../components/cms/editors/DualLanguageInput';

const HeroEditor = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        en: {
            title: '',
            subtitle: '',
            ctaButton1Label: '',
            ctaButton1Url: '',
            ctaButton2Label: '',
            ctaButton2Url: ''
        },
        id: {
            title: '',
            subtitle: '',
            ctaButton1Label: '',
            ctaButton1Url: '',
            ctaButton2Label: '',
            ctaButton2Url: ''
        },
        backgroundType: 'gradient',
        animatedBlobs: true,
        heroImageUrl: '',
        status: 'draft'
    });

    // Load existing data
    useEffect(() => {
        const loadData = async () => {
            try {
                const content = await fetchCMSSection('hero');
                if (content) {
                    setFormData(content);
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
            [lang]: {
                ...prev[lang],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const dataToSave = {
                ...formData,
                status: 'published', // Always publish when saving
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser?.id,
                version: (formData.version || 0) + 1
            };

            // Use unified CMS service - automatically sets is_published=true
            await saveCMSSection('hero', dataToSave, currentUser?.id);

            setFormData(dataToSave);
            setMessage({
                type: 'success',
                text: 'Changes saved and published successfully!'
            });

            // Clear message after 3 seconds
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Hero Section</h1>
                        <p className="text-slate-600 mt-1">Edit the main banner of your landing page</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Save & Publish Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save & Publish'}
                        </button>

                        {/* Preview Button */}
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

                {/* Success/Error Message */}
                {message.text && (
                    <div className={`p-4 rounded-lg flex items-center ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                        )}
                        <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                            {message.text}
                        </span>
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
                {/* Title */}
                <DualLanguageInput
                    label="Hero Title"
                    valueEN={formData.en.title}
                    valueID={formData.id.title}
                    onChange={(lang, value) => handleLanguageChange(lang, 'title', value)}
                    required
                />

                {/* Subtitle */}
                <DualLanguageInput
                    label="Hero Subtitle"
                    valueEN={formData.en.subtitle}
                    valueID={formData.id.subtitle}
                    onChange={(lang, value) => handleLanguageChange(lang, 'subtitle', value)}
                    multiline
                    required
                />

                {/* CTA Button 1 */}
                <div className="border-t border-slate-200 pt-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Primary CTA Button</h3>

                    <div className="space-y-4">
                        <DualLanguageInput
                            label="Button Label"
                            valueEN={formData.en.ctaButton1Label}
                            valueID={formData.id.ctaButton1Label}
                            onChange={(lang, value) => handleLanguageChange(lang, 'ctaButton1Label', value)}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Button URL
                            </label>
                            <input
                                type="text"
                                value={formData.en.ctaButton1Url}
                                onChange={(e) => handleLanguageChange('en', 'ctaButton1Url', e.target.value)}
                                placeholder="/register"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* CTA Button 2 */}
                <div className="border-t border-slate-200 pt-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Secondary CTA Button</h3>

                    <div className="space-y-4">
                        <DualLanguageInput
                            label="Button Label"
                            valueEN={formData.en.ctaButton2Label}
                            valueID={formData.id.ctaButton2Label}
                            onChange={(lang, value) => handleLanguageChange(lang, 'ctaButton2Label', value)}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Button URL
                            </label>
                            <input
                                type="text"
                                value={formData.en.ctaButton2Url}
                                onChange={(e) => handleLanguageChange('en', 'ctaButton2Url', e.target.value)}
                                placeholder="/login"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Background Settings */}
                <div className="border-t border-slate-200 pt-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Background Settings</h3>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="animatedBlobs"
                            checked={formData.animatedBlobs}
                            onChange={(e) => setFormData(prev => ({ ...prev, animatedBlobs: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                        />
                        <label htmlFor="animatedBlobs" className="ml-2 text-sm text-slate-700">
                            Enable animated background blobs
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroEditor;
