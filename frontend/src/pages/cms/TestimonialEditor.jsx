import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCMSSection, saveCMSSection } from '../../services/cmsService';
import { Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import DualLanguageInput from '../../components/cms/editors/DualLanguageInput';
import ReorderableList from '../../components/cms/editors/ReorderableList';

const TestimonialEditor = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        title: { en: '', id: '' },
        subtitle: { en: '', id: '' },
        items: []
    });

    // Load existing data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Use unified CMS service
                const content = await fetchCMSSection('testimonial');
                
                if (content) {
                    // Handle migration from old single testimonial to new list format
                    if (content.items && Array.isArray(content.items)) {
                        // New format: { title, subtitle, items: [...] }
                        setFormData({
                            title: content.title || { en: 'Testimonials', id: 'Testimoni' },
                            subtitle: content.subtitle || { en: 'What our users say', id: 'Apa kata pengguna kami' },
                            items: content.items.map(item => ({
                                ...item,
                                userName: item.userName || '',
                                userRole: item.userRole || '',
                                content: item.content || { en: '', id: '' }
                            }))
                        });
                    } else {
                        // Old format: single testimonial - migrate to new format
                        setFormData({
                            title: { en: 'Testimonials', id: 'Testimoni' },
                            subtitle: { en: 'What our users say', id: 'Apa kata pengguna kami' },
                            items: content.userName ? [{
                                id: Date.now(),
                                userName: content.userName || '',
                                userRole: content.userRole || '',
                                content: content.en?.content || content.id?.content 
                                    ? { en: content.en?.content || '', id: content.id?.content || '' }
                                    : (typeof content.content === 'object' ? content.content : { en: content.content || '', id: '' })
                            }] : []
                        });
                    }
                } else {
                    // Default empty state
                    setFormData({
                        title: { en: 'Testimonials', id: 'Testimoni' },
                        subtitle: { en: 'What our users say', id: 'Apa kata pengguna kami' },
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

    const handleTestimonialAdd = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: Date.now(),
                    userName: '',
                    userRole: '',
                    content: { en: '', id: '' }
                }
            ]
        }));
    };

    const handleTestimonialChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleTestimonialLangChange = (index, lang, field, value) => {
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
            await saveCMSSection('testimonial', dataToSave, currentUser?.id);

            setFormData(dataToSave);
            setMessage({
                type: 'success',
                text: 'Changes saved and published successfully!'
            });

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
                        <h1 className="text-3xl font-bold text-slate-900">Testimonials Section</h1>
                        <p className="text-slate-600 mt-1">Manage customer testimonials</p>
                    </div>

                    <div className="flex items-center space-x-3">
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

                {/* Testimonials List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <ReorderableList
                        title="Testimonials"
                        description="Add, remove, and reorder testimonials"
                        items={formData.items}
                        onChange={(newItems) => setFormData(prev => ({ ...prev, items: newItems }))}
                        onAdd={handleTestimonialAdd}
                        addButtonLabel="Add Testimonial"
                        renderItem={(item, index) => (
                            <div className="space-y-4">
                                {/* User Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            User Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={item.userName || ''}
                                            onChange={(e) => handleTestimonialChange(index, 'userName', e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            User Role <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={item.userRole || ''}
                                            onChange={(e) => handleTestimonialChange(index, 'userRole', e.target.value)}
                                            placeholder="Homeowner"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Testimonial Content */}
                                <DualLanguageInput
                                    label="Testimonial Content"
                                    valueEN={item.content?.en || ''}
                                    valueID={item.content?.id || ''}
                                    onChange={(lang, value) => handleTestimonialLangChange(index, lang, 'content', value)}
                                    multiline
                                    required
                                />
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default TestimonialEditor;
