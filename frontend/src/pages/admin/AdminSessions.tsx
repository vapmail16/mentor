import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, BookOpen, Search, Loader2, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { sessionsService, Session } from '@/services/api';
import { adminService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const result = await sessionsService.getAllSessions({
        search: search || undefined,
        limit,
        offset,
      });
      const sessionsArray = Array.isArray(result) ? result : (result as any).data || [];
      setSessions(sessionsArray);
      setTotal(sessionsArray.length);
    } catch (error: any) {
      toast({
        title: 'Failed to load sessions',
        description: error.message || 'Could not fetch sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [offset]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (offset === 0) {
        fetchSessions();
      } else {
        setOffset(0);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [search]);

  const filteredSessions = sessions.filter(session => {
    if (publishedFilter === 'published' && !session.is_published) return false;
    if (publishedFilter === 'unpublished' && session.is_published) return false;
    return true;
  });

  const handleTogglePublish = async (session: Session) => {
    try {
      await adminService.updateSession(session.id, {
        is_published: !session.is_published,
      });
      toast({
        title: 'Session updated',
        description: `Session ${!session.is_published ? 'published' : 'unpublished'} successfully`,
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update session',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await adminService.deleteSession(sessionId);
      toast({
        title: 'Session deleted',
        description: 'Session has been deleted successfully',
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete session',
        variant: 'destructive',
      });
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
                <BookOpen className="h-8 w-8 text-primary" />
                Manage Sessions
              </h1>
              <p className="text-muted-foreground">
                View and manage all sessions ({filteredSessions.length} shown)
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
                  placeholder="Search sessions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={publishedFilter}
                onChange={(e) => setPublishedFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Sessions</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>List of all platform sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sessions found</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Mentor</th>
                          <th className="text-left p-2">Language</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSessions.map((session) => (
                          <tr key={session.id} className="border-b">
                            <td className="p-2">
                              <div className="font-medium">{session.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {session.description}
                              </div>
                            </td>
                            <td className="p-2 text-sm">
                              {session.mentor?.full_name || 'Unknown'}
                            </td>
                            <td className="p-2 text-sm">{session.language}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  session.is_published
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {session.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(session.created_at)}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Link to={`/sessions/${session.id}`}>
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTogglePublish(session)}
                                >
                                  {session.is_published ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(session.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sessions.length >= limit && (
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
