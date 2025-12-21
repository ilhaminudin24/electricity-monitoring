import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCMSSection, saveCMSSection } from '../../services/cmsService';
// import { supabase } from '../../supabaseClient'; // Still needed for image uploads - Not used here
import { Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import DualLanguageInput from '../../components/cms/editors/DualLanguageInput';
import ReorderableList from '../../components/cms/editors/ReorderableList';
import ImageUpload from '../../components/cms/editors/ImageUpload';

const ScreenshotEditor = () => {
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
                const content = await fetchCMSSection('screenshots');

                if (content) {
                    setFormData({
                        ...content,
                        title: {
                            en: content.title?.en || 'Screenshots',
                            id: content.title?.id || 'Tangkapan Layar'
                        },
                        subtitle: {
                            en: content.subtitle?.en || 'See the app in action',
                            id: content.subtitle?.id || 'Lihat aplikasi beraksi'
                        },
                        items: (content.items || []).map(item => ({
                            ...item,
                            caption: {
                                en: item.caption?.en || '',
                                id: item.caption?.id || ''
                            }
                        }))
                    });
                } else {
                    setFormData({
                        title: { en: 'Screenshots', id: 'Tangkapan Layar' },
                        subtitle: { en: 'See the app in action', id: 'Lihat aplikasi beraksi' },
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

    const handleItemAdd = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: Date.now(),
                    image: '',
                    caption: { en: '', id: '' }
                }
            ]
        }));
    };

    const handleItemLangChange = (index, lang, field, value) => {
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

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
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
            await saveCMSSection('screenshots', dataToSave, currentUser?.id);

            setFormData(dataToSave);
            setMessage({
                type: 'success',
                text: 'Screenshots saved successfully!'
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
                    <h1 className="text-3xl font-bold text-slate-900">Screenshot Section</h1>
                    <p className="text-slate-600 mt-1">Manage app screenshots</p>
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

                {/* Screenshots List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <ReorderableList
                        title="Screenshots"
                        description="Add, remove, and reorder screenshots"
                        items={formData.items}
                        onChange={(newItems) => setFormData(prev => ({ ...prev, items: newItems }))}
                        onAdd={handleItemAdd}
                        addButtonLabel="Add Screenshot"
                        renderItem={(item, index) => (
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Screenshot Image"
                                    bucketName="meter-photos"
                                    storagePath="cms/screenshots"
                                    inputId={`screenshot-upload-${item.id}`}
                                    currentUrl={item.image}
                                    onUpload={(url) => handleItemChange(index, 'image', url)}
                                />
                                <DualLanguageInput
                                    label="Caption"
                                    valueEN={item.caption?.en || ''}
                                    valueID={item.caption?.id || ''}
                                    onChange={(lang, value) => handleItemLangChange(index, lang, 'caption', value)}
                                />
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default ScreenshotEditor;
