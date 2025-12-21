import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';

const ICON_LIST = [
    'Zap', 'BarChart3', 'Calculator', 'Cloud', 'Shield', 'History',
    'ArrowRight', 'Check', 'Github', 'Mail', 'Users', 'Settings',
    'Lock', 'Smartphone', 'Globe', 'Briefcase', 'Code', 'Database',
    'Layout', 'Monitor', 'Server', 'Terminal', 'Cpu', 'HardDrive',
    'Wifi', 'Battery', 'Bluetooth', 'Camera', 'Headphones', 'Speaker',
    'Mic', 'Video', 'MessageSquare', 'Phone', 'Search', 'MapPin',
    'Calendar', 'Clock', 'CreditCard', 'DollarSign', 'ShoppingBag'
];

const IconSelector = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const SelectedIcon = value && LucideIcons[value] ? LucideIcons[value] : null;

    const filteredIcons = ICON_LIST.filter(iconName =>
        iconName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                    <div className="flex items-center">
                        {SelectedIcon ? (
                            <>
                                <SelectedIcon className="h-5 w-5 text-blue-600 mr-3" />
                                <span className="text-slate-900">{value}</span>
                            </>
                        ) : (
                            <span className="text-slate-500">Select an icon...</span>
                        )}
                    </div>
                    <LucideIcons.ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 flex flex-col">
                        <div className="p-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-lg">
                            <div className="relative">
                                <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search icons..."
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-2 grid grid-cols-4 gap-2">
                            {filteredIcons.map(iconName => {
                                const Icon = LucideIcons[iconName];
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => {
                                            onChange(iconName);
                                            setIsOpen(false);
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-md hover:bg-blue-50 transition-colors ${value === iconName ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                                        title={iconName}
                                    >
                                        <Icon className="h-6 w-6 text-slate-700 mb-1" />
                                        <span className="text-[10px] text-slate-500 truncate w-full text-center">{iconName}</span>
                                    </button>
                                );
                            })}
                            {filteredIcons.length === 0 && (
                                <div className="col-span-4 py-4 text-center text-slate-500 text-sm">
                                    No icons found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default IconSelector;
