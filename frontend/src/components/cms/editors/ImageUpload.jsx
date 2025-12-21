import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({ currentUrl, onUpload, storagePath, label = 'Image', inputId, bucketName = 'meter-photos' }) => {
    const { currentUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentUrl);

    // Use provided inputId or fallback to random string to ensure uniqueness
    const uniqueId = inputId || `image-upload-${Math.random().toString(36).substr(2, 9)}`;

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);

            // Check if user is authenticated
            if (!currentUser) {
                throw new Error('Anda harus login untuk mengupload gambar. Silakan login terlebih dahulu.');
            }

            // Check session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Session expired. Silakan login ulang.');
            }

            // Create storage path
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const fullPath = storagePath ? `${storagePath}/${fileName}` : fileName;

            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(fullPath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                // Provide more helpful error messages
                if (error.message?.includes('Bucket not found') || 
                    error.message?.includes('not found') ||
                    error.statusCode === '404' ||
                    error.message?.includes('The resource was not found')) {
                    
                    // Bucket might exist but not accessible - check RLS
                    throw new Error(
                        `Bucket '${bucketName}' tidak dapat diakses. ` +
                        `Pastikan:\n` +
                        `1. Bucket sudah dibuat di Supabase Dashboard > Storage\n` +
                        `2. Bucket di-set sebagai PUBLIC\n` +
                        `3. RLS Policy sudah dikonfigurasi untuk allow INSERT\n` +
                        `4. User sudah login (authenticated)`
                    );
                } else if (error.message?.includes('new row violates row-level security') ||
                          error.message?.includes('row-level security')) {
                    throw new Error(
                        'Akses ditolak oleh RLS Policy. ' +
                        'Pastikan RLS policy untuk bucket sudah dikonfigurasi dengan benar. ' +
                        'Lihat SUPABASE_STORAGE_SETUP.md untuk instruksi.'
                    );
                } else if (error.message?.includes('JWT') || error.message?.includes('token')) {
                    throw new Error('Session expired. Silakan login ulang.');
                } else {
                    throw new Error(error.message || 'Gagal mengupload gambar. Silakan coba lagi.');
                }
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(data.path);

            const publicUrl = urlData.publicUrl;
            setPreview(publicUrl);
            onUpload(publicUrl);

        } catch (error) {
            const errorMessage = error.message || 'Gagal mengupload gambar. Silakan coba lagi.';
            alert(`Failed to upload image: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview('');
        onUpload('');
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
                {label}
            </label>

            {preview ? (
                <div className="relative inline-block">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-300"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id={uniqueId}
                        disabled={uploading}
                    />
                    <label
                        htmlFor={uniqueId}
                        className="cursor-pointer"
                    >
                        {uploading ? (
                            <div className="space-y-2">
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                                <p className="text-sm text-slate-600">Uploading...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-center">
                                    <ImageIcon className="h-12 w-12 text-slate-400" />
                                </div>
                                <div className="flex items-center justify-center text-sm text-slate-600">
                                    <Upload className="h-4 w-4 mr-2" />
                                    <span>Click to upload image</span>
                                </div>
                                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                        )}
                    </label>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
