import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, updateUserStatus, deleteUser } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users,
    Search,
    Shield,
    CheckCircle,
    AlertCircle,
    Trash2
} from 'lucide-react';

const UserManagement = () => {
    const { currentUser, resetPassword } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersData = await getAllUsers();
            setUsers(usersData);
        } catch (error) {
            setMessage({ type: 'error', text: `Failed to load users: ${error.message || 'Unknown error'}` });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = async (userId, currentRole) => {
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';

            // Prevent removing own admin status
            if (userId === currentUser?.id) {
                setMessage({ type: 'error', text: 'You cannot remove your own admin status' });
                return;
            }

            await updateUserRole(userId, newRole, currentUser?.id);

            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));

            setMessage({ type: 'success', text: `Role updated to ${newRole}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: `Failed to update role: ${error.message || 'Unknown error'}` });
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'disabled' : 'active';

            // Prevent disabling self
            if (userId === currentUser?.id) {
                setMessage({ type: 'error', text: 'You cannot disable your own account' });
                return;
            }

            await updateUserStatus(userId, newStatus, currentUser?.id);

            // Update local state
            setUsers(users.map(user =>
                user.id === userId ? { ...user, status: newStatus } : user
            ));

            setMessage({ type: 'success', text: `User ${newStatus === 'active' ? 'activated' : 'disabled'}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: `Failed to update status: ${error.message || 'Unknown error'}` });
        }
    };

    const handlePasswordReset = async (email) => {
        if (!window.confirm(`Send password reset email to ${email}?`)) return;

        try {
            await resetPassword(email);
            setMessage({ type: 'success', text: `Password reset email sent to ${email}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send reset email: ' + error.message });
        }
    };

    const handleDeleteUser = async (userId, userEmail, userName) => {
        // Prevent deleting self
        if (userId === currentUser?.id) {
            setMessage({ type: 'error', text: 'You cannot delete your own account' });
            return;
        }

        // Double confirmation for delete
        const confirmMessage = `Are you sure you want to delete user "${userName || userEmail}"?\n\nThis will:\n- Delete user profile\n- Delete all user readings\n- This action cannot be undone!`;
        
        if (!window.confirm(confirmMessage)) return;

        // Final confirmation
        if (!window.confirm('This is your final warning. Delete this user permanently?')) return;

        try {
            await deleteUser(userId);
            
            // Remove from local state
            setUsers(users.filter(user => user.id !== userId));
            
            setMessage({ type: 'success', text: `User "${userName || userEmail}" has been deleted` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: `Failed to delete user: ${error.message || 'Unknown error'}` });
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-600 mt-1">Manage user access and roles</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="mr-2 h-5 w-5" /> : <AlertCircle className="mr-2 h-5 w-5" />}
                    {message.text}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">User</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Role</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Last Login</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {user.photoURL ? (
                                                    <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-slate-900">{user.displayName || 'Unnamed User'}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {user.role === 'admin' ? (
                                                <Shield className="w-3 h-3 mr-1" />
                                            ) : (
                                                <Users className="w-3 h-3 mr-1" />
                                            )}
                                            {user.role === 'admin' ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'disabled'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {user.status === 'active' ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin.toLocaleDateString() : new Date(user.lastLogin).toLocaleDateString()) : 'Never'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleRoleToggle(user.id, user.role)}
                                                className="text-blue-600 hover:text-blue-900 text-sm font-medium disabled:opacity-50"
                                                disabled={user.id === currentUser?.id}
                                            >
                                                {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                onClick={() => handleStatusToggle(user.id, user.status)}
                                                className={`${user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} text-sm font-medium disabled:opacity-50`}
                                                disabled={user.id === currentUser?.id}
                                            >
                                                {user.status === 'active' ? 'Disable' : 'Activate'}
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                onClick={() => handlePasswordReset(user.email)}
                                                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                                                title="Send Password Reset Email"
                                            >
                                                Reset Pwd
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.email, user.displayName)}
                                                className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 flex items-center"
                                                disabled={user.id === currentUser?.id}
                                                title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete user permanently"}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
