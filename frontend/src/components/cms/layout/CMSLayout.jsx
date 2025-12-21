import React from 'react';
import CMSSidebar from './CMSSidebar';

const CMSLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <CMSSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default CMSLayout;
