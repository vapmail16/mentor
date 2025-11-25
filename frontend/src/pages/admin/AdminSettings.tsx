import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Loader2, Database, Server, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { adminService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { config } from '@/config';

export default function AdminSettings() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error: any) {
        toast({
          title: 'Failed to load settings',
          description: error.message || 'Could not fetch platform statistics',
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
          <div className="mb-8 flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Settings className="h-8 w-8 text-primary" />
                Settings
              </h1>
              <p className="text-muted-foreground">
                Platform configuration and settings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Platform Information
                </CardTitle>
                <CardDescription>System configuration details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">API URL</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                    {config.apiUrl}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Frontend URL</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                    {config.frontendUrl}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Environment</label>
                  <p className="text-sm bg-muted p-2 rounded mt-1">
                    {config.environment || 'production'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Database Status
                </CardTitle>
                <CardDescription>Connection and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Users</span>
                      <span className="font-semibold">{stats.totalUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Sessions</span>
                      <span className="font-semibold">{stats.activeSessions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Mentors</span>
                      <span className="font-semibold">{stats.activeMentors || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unable to load database status</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>Platform user settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/admin/users">
                  <Button variant="outline" className="w-full justify-start">
                    Manage Users
                  </Button>
                </Link>
                <Link to="/admin/mentors">
                  <Button variant="outline" className="w-full justify-start">
                    Manage Mentors
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Content Management
                </CardTitle>
                <CardDescription>Manage platform content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/admin/sessions">
                  <Button variant="outline" className="w-full justify-start">
                    Manage Sessions
                  </Button>
                </Link>
                <Link to="/admin/learning-paths">
                  <Button variant="outline" className="w-full justify-start">
                    Manage Learning Paths
                  </Button>
                </Link>
                <Link to="/admin/subscriptions">
                  <Button variant="outline" className="w-full justify-start">
                    View Subscriptions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Platform-wide configuration options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Advanced configuration options including email templates, payment gateway settings, 
                API keys management, and system logs will be available in a future update.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Email templates and notifications configuration</p>
                <p>• Payment gateway settings (Cashfree)</p>
                <p>• API keys and integrations management</p>
                <p>• System logs and monitoring dashboard</p>
                <p>• Feature flags and A/B testing controls</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </AdminRoute>
  );
}
