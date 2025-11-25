import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Search, Loader2, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { mentorsService, Mentor } from '@/services/api';
import { adminService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const result = await mentorsService.getAllMentors({
        verification_status: statusFilter || undefined,
        limit,
        offset,
      });
      const mentorsArray = Array.isArray(result) ? result : (result as any).data || [];
      setMentors(mentorsArray);
    } catch (error: any) {
      toast({
        title: 'Failed to load mentors',
        description: error.message || 'Could not fetch mentors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [offset, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (offset === 0) {
        fetchMentors();
      } else {
        setOffset(0);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [search]);

  const filteredMentors = mentors.filter(mentor => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        mentor.full_name.toLowerCase().includes(searchLower) ||
        mentor.bio?.toLowerCase().includes(searchLower) ||
        mentor.domains.some(d => d.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const handleVerify = async (mentorId: string, status: 'verified' | 'rejected') => {
    try {
      await adminService.updateMentorVerification(mentorId, status);
      toast({
        title: 'Mentor updated',
        description: `Mentor ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      });
      fetchMentors();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update mentor verification',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatDate = (dateString: string) => {
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
                Manage Mentors
              </h1>
              <p className="text-muted-foreground">
                Verify and manage mentor accounts ({filteredMentors.length} shown)
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
                  placeholder="Search mentors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mentors</CardTitle>
              <CardDescription>List of all mentor applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMentors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No mentors found</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Mentor</th>
                          <th className="text-left p-2">Domains</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMentors.map((mentor) => (
                          <tr key={mentor.id} className="border-b">
                            <td className="p-2">
                              <div className="font-medium">{mentor.full_name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {mentor.bio || 'No bio'}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {mentor.domains.slice(0, 2).map((domain, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    {domain}
                                  </span>
                                ))}
                                {mentor.domains.length > 2 && (
                                  <span className="px-2 py-1 text-xs text-muted-foreground">
                                    +{mentor.domains.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(mentor.verification_status)}
                                <span
                                  className={`px-2 py-1 rounded text-sm capitalize ${
                                    mentor.verification_status === 'verified'
                                      ? 'bg-green-100 text-green-800'
                                      : mentor.verification_status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {mentor.verification_status}
                                </span>
                              </div>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(mentor.created_at)}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Link to={`/mentors/${mentor.id}`}>
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {mentor.verification_status !== 'verified' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVerify(mentor.id, 'verified')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {mentor.verification_status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVerify(mentor.id, 'rejected')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {mentors.length >= limit && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setOffset(offset + limit)}
                        disabled={mentors.length < limit}
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
