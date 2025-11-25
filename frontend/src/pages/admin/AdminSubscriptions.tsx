import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Loader2, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { adminService, AdminSubscription } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const limit = 20;
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await adminService.getSubscriptions({
        status: statusFilter || undefined,
        limit,
        offset,
      });
      setSubscriptions(result.subscriptions);
      setTotal(result.total);
    } catch (error: any) {
      toast({
        title: 'Failed to load subscriptions',
        description: error.message || 'Could not fetch subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [offset, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount / 100); // Assuming amount is in paise/cents
  };

  const totalRevenue = subscriptions
    .filter(s => s.payment_status === 'completed')
    .reduce((sum, s) => sum + s.amount, 0);

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
                <TrendingUp className="h-8 w-8 text-primary" />
                Subscriptions
              </h1>
              <p className="text-muted-foreground">
                View subscription analytics and manage subscriptions ({total} total)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {formatCurrency(totalRevenue, subscriptions[0]?.currency || 'INR')}
                </div>
                <p className="text-xs text-muted-foreground">From completed payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscriptions.filter(s => 
                    s.payment_status === 'completed' && 
                    new Date(s.expires_at) > new Date()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>List of all platform subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : subscriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No subscriptions found</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">User</th>
                          <th className="text-left p-2">Plan</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Started</th>
                          <th className="text-left p-2">Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((subscription) => (
                          <tr key={subscription.id} className="border-b">
                            <td className="p-2">
                              <div className="font-medium">{subscription.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {subscription.email}
                              </div>
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm capitalize">
                                {subscription.plan_type}
                              </span>
                            </td>
                            <td className="p-2 font-medium">
                              {formatCurrency(subscription.amount, subscription.currency)}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  subscription.payment_status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : subscription.payment_status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {subscription.payment_status}
                              </span>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(subscription.started_at)}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(subscription.expires_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {subscriptions.length >= limit && (
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
                  )}
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
