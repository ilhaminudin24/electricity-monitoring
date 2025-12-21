import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCMSSection, saveCMSSection } from '../../services/cmsService';
import { Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import DualLanguageInput from '../../components/cms/editors/DualLanguageInput';
import IconSelector from '../../components/cms/editors/IconSelector';
import ReorderableList from '../../components/cms/editors/ReorderableList';

const FeaturesEditor = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        title: { en: '', id: '' },
        subtitle: { en: '', id: '' },
        items: []
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const content = await fetchCMSSection('features');
                
                if (content) {
                    setFormData({
                        ...content,
                        title: {
                            en: content.title?.en || 'Features',
                            id: content.title?.id || 'Fitur'
                        },
                        subtitle: {
                            en: content.subtitle?.en || 'Our main features',
                            id: content.subtitle?.id || 'Fitur utama kami'
                        },
                        items: (content.items || []).map(item => ({
                            ...item,
                            title: {
                                en: item.title?.en || '',
                                id: item.title?.id || ''
                            },
                            description: {
                                en: item.description?.en || '',
                                id: item.description?.id || ''
                            }
                        }))
                    });
                } else {
                    // Default/Initial state if no data exists
                    setFormData({
                        title: { en: 'Features', id: 'Fitur' },
                        subtitle: { en: 'Our main features', id: 'Fitur utama kami' },
                        items: []
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

    const handleFeatureAdd = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: Date.now(),
                    icon: 'Zap',
                    title: { en: '', id: '' },
                    description: { en: '', id: '' }
                }
            ]
        }));
    };

    const handleFeatureChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleFeatureLangChange = (index, lang, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            [field]: {
                ...newItems[index][field],
                [lang]: value
            }
        };
        setFormData(prev => ({ ...prev, items: newItems }));
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
            await saveCMSSection('features', dataToSave, currentUser?.id);

            setFormData(dataToSave);
            setMessage({
                type: 'success',
                text: 'Features saved successfully!'
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
                    <h1 className="text-3xl font-bold text-slate-900">Features Section</h1>
                    <p className="text-slate-600 mt-1">Manage the features list on the landing page</p>
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
                {/* Section Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-xl font-semibold mb-6">Section Header</h2>
                    <DualLanguageInput
                        label="Section Title"
                        valueEN={formData.title?.en || ''}
                        valueID={formData.title?.id || ''}
                        onChange={(lang, value) => handleLanguageChange(lang, 'title', value)}
                        required
                    />
                    <div className="h-4" />
                    <DualLanguageInput
                        label="Section Subtitle"
                        valueEN={formData.subtitle?.en || ''}
                        valueID={formData.subtitle?.id || ''}
                        onChange={(lang, value) => handleLanguageChange(lang, 'subtitle', value)}
                        multiline
                    />
                </div>

                {/* Features List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <ReorderableList
                        title="Feature Cards"
                        description="Add, remove, and reorder feature cards"
                        items={formData.items}
                        onChange={(newItems) => setFormData(prev => ({ ...prev, items: newItems }))}
                        onAdd={handleFeatureAdd}
                        addButtonLabel="Add Feature"
                        renderItem={(item, index) => (
                            <div className="space-y-4">
                                <IconSelector
                                    label="Icon"
                                    value={item.icon}
                                    onChange={(value) => handleFeatureChange(index, 'icon', value)}
                                />
                                <DualLanguageInput
                                    label="Feature Title"
                                    valueEN={item.title?.en || ''}
                                    valueID={item.title?.id || ''}
                                    onChange={(lang, value) => handleFeatureLangChange(index, lang, 'title', value)}
                                />
                                <DualLanguageInput
                                    label="Feature Description"
                                    valueEN={item.description?.en || ''}
                                    valueID={item.description?.id || ''}
                                    onChange={(lang, value) => handleFeatureLangChange(index, lang, 'description', value)}
                                    multiline
                                />
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default FeaturesEditor;
