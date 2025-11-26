import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, BookOpen, Search, Loader2, Eye, EyeOff, Trash2, ExternalLink, Edit, Youtube, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { sessionsService, Session } from '@/services/api';
import { adminService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { extractYouTubeVideoId, isValidYouTubeUrl } from '@/utils/youtube';

export default function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { toast } = useToast();
  
  // Edit modal state
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    // Pre-fill YouTube URL if it exists
    if (session.main_video_url && session.main_video_url.includes('youtube.com')) {
      setYoutubeUrl(session.main_video_url);
    } else if ((session as any).youtube_video_id) {
      setYoutubeUrl(`https://www.youtube.com/watch?v=${(session as any).youtube_video_id}`);
    } else {
      setYoutubeUrl('');
    }
  };

  const handleCloseEdit = () => {
    setEditingSession(null);
    setYoutubeUrl('');
  };

  const handleSaveYouTubeLink = async () => {
    if (!editingSession) return;

    if (youtubeUrl && !isValidYouTubeUrl(youtubeUrl)) {
      toast({
        title: 'Invalid YouTube URL',
        description: 'Please enter a valid YouTube URL or video ID',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const videoId = youtubeUrl ? extractYouTubeVideoId(youtubeUrl) : null;
      const updates: any = {
        video_type: videoId ? 'youtube' : 'upload',
      };

      if (videoId) {
        updates.youtube_video_id = videoId;
        updates.main_video_url = `https://www.youtube.com/watch?v=${videoId}`;
      } else if (!youtubeUrl) {
        // Clear video if URL is empty
        updates.youtube_video_id = null;
        updates.main_video_url = null;
      }

      await adminService.updateSession(editingSession.id, updates);
      toast({
        title: 'Session updated',
        description: 'YouTube video link has been updated successfully',
      });
      handleCloseEdit();
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update session',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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
                              <div className="font-medium flex items-center gap-2">
                                {session.title}
                                {(session as any).video_type === 'youtube' && (session as any).youtube_video_id && (
                                  <Youtube className="h-4 w-4 text-red-600" title="YouTube video" />
                                )}
                              </div>
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(session)}
                                  title="Edit YouTube link"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Link to={`/sessions/${session.id}`}>
                                  <Button size="sm" variant="outline" title="View session">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTogglePublish(session)}
                                  title={session.is_published ? 'Unpublish' : 'Publish'}
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
                                  title="Delete session"
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

      {/* Edit YouTube Link Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  <CardTitle>Edit YouTube Video Link</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {editingSession.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="youtube-url">YouTube URL or Video ID</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=... or just the video ID"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the YouTube URL or just the video ID. Examples:
                  <br />
                  • https://www.youtube.com/watch?v=dQw4w9WgXcQ
                  <br />
                  • https://youtu.be/dQw4w9WgXcQ
                  <br />
                  • dQw4w9WgXcQ
                </p>
              </div>
              {youtubeUrl && isValidYouTubeUrl(youtubeUrl) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✓ Valid YouTube URL detected
                  </p>
                </div>
              )}
              {youtubeUrl && !isValidYouTubeUrl(youtubeUrl) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    ✗ Invalid YouTube URL format
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCloseEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveYouTubeLink}
                  disabled={isSaving || (youtubeUrl && !isValidYouTubeUrl(youtubeUrl))}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save YouTube Link'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminRoute>
  );
}
