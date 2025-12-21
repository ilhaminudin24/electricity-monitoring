import React from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

const ReorderableList = ({
    items,
    onChange,
    renderItem,
    onAdd,
    addButtonLabel = "Add Item",
    title,
    description,
    maxItems
}) => {
    const handleMove = (index, direction) => {
        const newItems = [...items];
        const item = newItems[index];

        // Remove item from current position
        newItems.splice(index, 1);

        // Insert at new position
        newItems.splice(index + direction, 0, item);

        onChange(newItems);
    };

    const handleRemove = (index) => {
        if (window.confirm('Are you sure you want to remove this item?')) {
            const newItems = [...items];
            newItems.splice(index, 1);
            onChange(newItems);
        }
    };

    const isMaxItemsReached = maxItems && items.length >= maxItems;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
                    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
                </div>
                {!isMaxItemsReached && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {addButtonLabel}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="relative bg-white border border-slate-200 rounded-xl p-4 transition-all hover:shadow-md hover:border-blue-200 group"
                    >
                        <div className="flex items-start gap-4">
                            {/* Order Controls */}
                            <div className="flex flex-col gap-1 mt-1">
                                <button
                                    type="button"
                                    onClick={() => handleMove(index, -1)}
                                    disabled={index === 0}
                                    className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                    title="Move Up"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMove(index, 1)}
                                    disabled={index === items.length - 1}
                                    className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                    title="Move Down"
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                {renderItem(item, index)}
                            </div>

                            {/* Delete Button */}
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove Item"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-sm">No items yet. Click "{addButtonLabel}" to add one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReorderableList;
