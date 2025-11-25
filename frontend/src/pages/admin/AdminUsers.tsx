import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Search, Loader2, Edit, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { adminService, AdminUser } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState<string>('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await adminService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        limit,
        offset,
      });
      setUsers(result.users);
      setTotal(result.total);
    } catch (error: any) {
      toast({
        title: 'Failed to load users',
        description: error.message || 'Could not fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [offset, roleFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (offset === 0) {
        fetchUsers();
      } else {
        setOffset(0);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [search]);

  const handleUpdateUser = async (userId: string) => {
    try {
      const updated = await adminService.updateUser(userId, {
        role: editedRole,
      });
      setUsers(users.map(u => u.id === userId ? updated : u));
      setEditingUserId(null);
      toast({
        title: 'User updated',
        description: 'User role has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update user',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (user: AdminUser) => {
    setEditingUserId(user.id);
    setEditedRole(user.role);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditedRole('');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <AppNavigation />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Manage Users
              </h1>
              <p className="text-muted-foreground">
                View and manage all platform users ({total} total)
              </p>
            </div>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="mentor">Mentor</option>
                <option value="mentee">Mentee</option>
                <option value="guest">Guest</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>List of all platform users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Last Login</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">{user.full_name}</td>
                            <td className="p-2">
                              {editingUserId === user.id ? (
                                <select
                                  value={editedRole}
                                  onChange={(e) => setEditedRole(e.target.value)}
                                  className="px-2 py-1 border rounded"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="mentor">Mentor</option>
                                  <option value="mentee">Mentee</option>
                                  <option value="guest">Guest</option>
                                </select>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                  {user.role}
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  user.subscription_status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {user.subscription_status}
                              </span>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(user.last_login_at)}
                            </td>
                            <td className="p-2">
                              {editingUserId === user.id ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateUser(user.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </AdminRoute>
  );
}
