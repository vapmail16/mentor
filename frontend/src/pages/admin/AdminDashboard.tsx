import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, BookOpen, GraduationCap, Settings, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { adminService, AdminStats } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error: any) {
        toast({
          title: 'Failed to load statistics',
          description: error.message || 'Could not fetch dashboard statistics',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users, sessions, mentors, and platform settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Management */}
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Users
              </CardTitle>
              <CardDescription>Manage all platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/users">
                <Button className="w-full">Manage Users</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Sessions Management */}
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Sessions
              </CardTitle>
              <CardDescription>Manage all sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/sessions">
                <Button className="w-full">Manage Sessions</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Learning Paths Management */}
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Learning Paths
              </CardTitle>
              <CardDescription>Manage learning paths</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/learning-paths">
                <Button className="w-full">Manage Learning Paths</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Mentors Management */}
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Mentors
              </CardTitle>
              <CardDescription>Verify and manage mentors</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/mentors">
                <Button className="w-full">Manage Mentors</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Subscriptions */}
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Subscriptions
              </CardTitle>
              <CardDescription>View subscription analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/subscriptions">
                <Button className="w-full">View Subscriptions</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Settings
              </CardTitle>
              <CardDescription>Platform configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/settings">
                <Button className="w-full" variant="outline">Settings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">All platform users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stats?.activeSessions ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Published sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Mentors</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stats?.activeMentors ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Verified mentors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stats?.activeSubscriptions ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Active paid users</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
      </div>
    </AdminRoute>
  );
}

