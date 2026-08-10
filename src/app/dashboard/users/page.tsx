'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Mail, Loader2, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'email', label: 'البريد الإلكتروني' },
  { id: 'settings', label: 'إعدادات الموقع' },
  { id: 'services', label: 'إدارة الخدمات' },
  { id: 'partners', label: 'إدارة الشركاء' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch {
      toast.error('حدث خطأ في جلب المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setPermissions(user.permissions);
      setIsActive(user.isActive);
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setRole('EMPLOYEE');
      setPermissions([]);
      setIsActive(true);
    }
    setShowModal(true);
  };

  const togglePermission = (permId: string) => {
    setPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload = editingUser ? {
        name, role, permissions, isActive
      } : {
        name, email, role, permissions
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء الحفظ');

      toast.success(editingUser ? 'تم التعديل بنجاح' : 'تم إضافة المستخدم وإرسال البريد بنجاح');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/users/${userToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم الحذف بنجاح');
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              إدارة فريق العمل
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              إضافة وتعديل صلاحيات الموظفين في النظام.
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            موظف جديد
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-4 px-6 text-sm font-semibold text-neutral-500 dark:text-neutral-400">المستخدم</th>
                  <th className="py-4 px-6 text-sm font-semibold text-neutral-500 dark:text-neutral-400">الدور</th>
                  <th className="py-4 px-6 text-sm font-semibold text-neutral-500 dark:text-neutral-400">الحالة</th>
                  <th className="py-4 px-6 text-sm font-semibold text-neutral-500 dark:text-neutral-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white">{u.name}</div>
                          <div className="text-sm text-neutral-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        u.role === 'OWNER' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' :
                        u.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}>
                        {u.role === 'OWNER' ? 'المدير العام' : u.role === 'MANAGER' ? 'مدير' : 'موظف'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" /> نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium">
                          <XCircle className="w-4 h-4" /> موقوف
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.role !== 'OWNER' && (
                          <button 
                            onClick={() => confirmDelete(u.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-neutral-500">لا يوجد مستخدمين.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-sans" dir="rtl">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                {editingUser ? 'تعديل المستخدم' : 'إضافة موظف جديد'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">الاسم</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
                  />
                  {!editingUser && (
                    <p className="text-xs text-neutral-500 mt-1">سيتم إرسال كلمة المرور المؤقتة إلى هذا البريد.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">الدور</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    disabled={editingUser?.role === 'OWNER'}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
                  >
                    <option value="EMPLOYEE">موظف (صلاحيات مخصصة)</option>
                    <option value="MANAGER">مدير (كامل الصلاحيات عدا حذف المدير)</option>
                    {editingUser?.role === 'OWNER' && <option value="OWNER">المدير العام</option>}
                  </select>
                </div>

                {role === 'EMPLOYEE' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 mt-4">صلاحيات الموظف</label>
                    <div className="grid grid-cols-2 gap-3">
                      {AVAILABLE_PERMISSIONS.map(perm => (
                        <label key={perm.id} className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors">
                          <input
                            type="checkbox"
                            checked={permissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-600"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {editingUser && editingUser.role !== 'OWNER' && (
                  <div className="pt-4 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-white">حالة الحساب</h4>
                      <p className="text-xs text-neutral-500">إيقاف الحساب يمنع المستخدم من الدخول للنظام</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900/50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                form="userForm"
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingUser ? 'حفظ التعديلات' : 'إضافة الموظف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-sans" dir="rtl">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">حذف الموظف</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
                هل أنت متأكد من رغبتك في حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  نعم، حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
