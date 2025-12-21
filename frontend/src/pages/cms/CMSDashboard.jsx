import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Clock, CheckCircle } from 'lucide-react';

const CMSDashboard = () => {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">CMS Dashboard</h1>
                <p className="text-slate-600">Manage your landing page content and users</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">7</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-600">Landing Sections</h3>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">7</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-600">Published</h3>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">-</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-600">Total Users</h3>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">Just now</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-600">Last Updated</h3>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link
                        to="/cms/landing-page/hero"
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-slate-900 mb-2">Edit Hero Section</h3>
                        <p className="text-sm text-slate-600">Update main banner and CTAs</p>
                    </Link>

                    <Link
                        to="/cms/landing-page/features"
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-slate-900 mb-2">Edit Features</h3>
                        <p className="text-sm text-slate-600">Manage feature cards</p>
                    </Link>

                    <Link
                        to="/cms/landing-page/testimonial"
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-slate-900 mb-2">Edit Testimonial</h3>
                        <p className="text-sm text-slate-600">Update customer testimonial</p>
                    </Link>

                    <Link
                        to="/cms/users"
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-slate-900 mb-2">Manage Users</h3>
                        <p className="text-sm text-slate-600">View and manage user accounts</p>
                    </Link>

                    <Link
                        to="/"
                        target="_blank"
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-slate-900 mb-2">Preview Landing Page</h3>
                        <p className="text-sm text-slate-600">View published landing page</p>
                    </Link>

                    <Link
                        to="/dashboard"
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <h3 className="font-semibold text-slate-900 mb-2">Go to App Dashboard</h3>
                        <p className="text-sm text-slate-600">Switch to user dashboard</p>
                    </Link>
                </div>
            </div>

            {/* Language Coverage */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Language Coverage</h2>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">English (EN)</span>
                            <span className="text-sm font-semibold text-green-600">100%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Indonesian (ID)</span>
                            <span className="text-sm font-semibold text-green-600">100%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CMSDashboard;
