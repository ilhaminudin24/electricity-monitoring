import React from 'react';

const DualLanguageInput = ({
    label,
    valueEN,
    valueID,
    onChange,
    type = 'text',
    placeholder = '',
    required = false,
    multiline = false
}) => {
    const InputComponent = multiline ? 'textarea' : 'input';

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* English Input */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                        🇬🇧 English
                    </label>
                    <InputComponent
                        type={type}
                        value={valueEN}
                        onChange={(e) => onChange('en', e.target.value)}
                        placeholder={placeholder}
                        required={required}
                        className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${multiline ? 'min-h-[100px] resize-y' : ''
                            }`}
                    />
                </div>

                {/* Indonesian Input */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                        🇮🇩 Indonesian
                    </label>
                    <InputComponent
                        type={type}
                        value={valueID}
                        onChange={(e) => onChange('id', e.target.value)}
                        placeholder={placeholder}
                        required={required}
                        className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${multiline ? 'min-h-[100px] resize-y' : ''
                            }`}
                    />
                </div>
            </div>
        </div>
    );
};

export default DualLanguageInput;
