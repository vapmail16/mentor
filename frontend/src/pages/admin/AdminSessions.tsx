import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, BookOpen, Search, Loader2, Eye, EyeOff, Trash2, ExternalLink, Edit, Youtube, X, Play, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { sessionsService, Session, mentorsService, Mentor, ShortVideo } from '@/services/api';
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
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Create session modal state
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [newSession, setNewSession] = useState({
    mentor_id: '',
    title: '',
    description: '',
    language: 'English',
    difficulty_level: 'beginner',
    youtube_url: '',
    is_published: true, // Default to published so mentees can see sessions
  });

  // Short videos management modal state
  const [showShortVideosModal, setShowShortVideosModal] = useState(false);
  const [selectedSessionForShorts, setSelectedSessionForShorts] = useState<Session | null>(null);
  const [shortVideos, setShortVideos] = useState<ShortVideo[]>([]);
  const [loadingShortVideos, setLoadingShortVideos] = useState(false);
  const [showAddShortVideo, setShowAddShortVideo] = useState(false);
  const [editingShortVideo, setEditingShortVideo] = useState<ShortVideo | null>(null);
  const [newShortVideo, setNewShortVideo] = useState({
    title: '',
    description: '',
    youtube_url: '',
  });

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
    // Load mentors for create session dropdown
    if (showCreateSession) {
      const loadMentors = async () => {
        try {
          const result = await mentorsService.getAllMentors({ limit: 100 });
          const mentorsArray = Array.isArray(result) ? result : (result as any).data || [];
          setMentors(mentorsArray.filter((m: Mentor) => m.verification_status === 'verified'));
        } catch (error) {
          console.error('Failed to load mentors:', error);
        }
      };
      loadMentors();
    }
  }, [showCreateSession]);

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
    // Pre-fill Spotify URL if it exists
    setSpotifyUrl(session.audio_file_url && session.audio_file_url.includes('spotify') ? session.audio_file_url : '');
  };

  const handleCloseEdit = () => {
    setEditingSession(null);
    setYoutubeUrl('');
    setSpotifyUrl('');
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

      // Add Spotify URL if provided
      if (spotifyUrl) {
        updates.audio_file_url = spotifyUrl;
      } else if (spotifyUrl === '' && editingSession.audio_file_url?.includes('spotify')) {
        // Clear Spotify URL if field is empty and it was a Spotify link
        updates.audio_file_url = null;
      }

      await adminService.updateSession(editingSession.id, updates);
      toast({
        title: 'Session updated',
        description: 'Session links have been updated successfully',
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

  const handleCreateSession = async () => {
    if (!newSession.mentor_id || !newSession.title || !newSession.description || !newSession.language) {
      toast({
        title: 'Validation Error',
        description: 'Mentor, title, description, and language are required',
        variant: 'destructive',
      });
      return;
    }

    if (newSession.youtube_url && !isValidYouTubeUrl(newSession.youtube_url)) {
      toast({
        title: 'Invalid YouTube URL',
        description: 'Please enter a valid YouTube URL or video ID',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingSession(true);
    try {
      const videoId = newSession.youtube_url ? extractYouTubeVideoId(newSession.youtube_url) : null;
      await adminService.createSession({
        mentor_id: newSession.mentor_id,
        title: newSession.title,
        description: newSession.description,
        language: newSession.language,
        difficulty_level: newSession.difficulty_level,
        youtube_video_id: videoId || undefined,
        video_type: videoId ? 'youtube' : 'upload',
        is_published: newSession.is_published,
      });

      toast({
        title: 'Session created',
        description: 'Session has been created successfully',
      });

      // Reset form
      setNewSession({
        mentor_id: '',
        title: '',
        description: '',
        language: 'English',
        difficulty_level: 'beginner',
        youtube_url: '',
        is_published: false,
      });
      setShowCreateSession(false);
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Create failed',
        description: error.message || 'Could not create session',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleManageShortVideos = async (session: Session) => {
    setSelectedSessionForShorts(session);
    setShowShortVideosModal(true);
    await loadShortVideos(session.id);
  };

  const loadShortVideos = async (sessionId: string) => {
    setLoadingShortVideos(true);
    try {
      const sessionData = await sessionsService.getSessionById(sessionId);
      setShortVideos((sessionData as any).short_videos || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load short videos',
        description: error.message || 'Could not fetch short videos',
        variant: 'destructive',
      });
    } finally {
      setLoadingShortVideos(false);
    }
  };

  const handleAddShortVideo = async () => {
    if (!selectedSessionForShorts || !newShortVideo.title || !newShortVideo.youtube_url) {
      toast({
        title: 'Validation Error',
        description: 'Title and YouTube URL are required',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidYouTubeUrl(newShortVideo.youtube_url)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube URL or video ID',
        variant: 'destructive',
      });
      return;
    }

    try {
      const videoId = extractYouTubeVideoId(newShortVideo.youtube_url);
      await sessionsService.addShortVideo(selectedSessionForShorts.id, {
        title: newShortVideo.title,
        description: newShortVideo.description || undefined,
        video_type: 'youtube',
        youtube_video_id: videoId || undefined,
        video_url: newShortVideo.youtube_url,
        order_index: shortVideos.length,
      });
      toast({
        title: 'Success',
        description: 'Short video added successfully',
      });
      setNewShortVideo({ title: '', description: '', youtube_url: '' });
      setShowAddShortVideo(false);
      await loadShortVideos(selectedSessionForShorts.id);
    } catch (error: any) {
      toast({
        title: 'Failed to add short video',
        description: error.message || 'Could not add short video',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteShortVideo = async (shortVideoId: string) => {
    if (!confirm('Are you sure you want to delete this short video?')) {
      return;
    }

    try {
      await sessionsService.deleteShortVideo(shortVideoId);
      toast({
        title: 'Success',
        description: 'Short video deleted successfully',
      });
      if (selectedSessionForShorts) {
        await loadShortVideos(selectedSessionForShorts.id);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to delete short video',
        description: error.message || 'Could not delete short video',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateShortVideoOrder = async (shortVideoId: string, newOrder: number) => {
    try {
      await sessionsService.updateShortVideo(shortVideoId, { order_index: newOrder });
      if (selectedSessionForShorts) {
        await loadShortVideos(selectedSessionForShorts.id);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to update order',
        description: error.message || 'Could not update video order',
        variant: 'destructive',
      });
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                Manage Sessions
              </h1>
              <p className="text-muted-foreground">
                View and manage all sessions ({filteredSessions.length} shown)
              </p>
            </div>
            <Button onClick={() => setShowCreateSession(true)}>
              <BookOpen className="h-4 w-4 mr-2" />
              Create Session
            </Button>
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleManageShortVideos(session)}
                                  title="Manage Short Videos"
                                >
                                  <Youtube className="h-4 w-4" />
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
                  <CardTitle>Edit Video & Audio Links</CardTitle>
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
              <div>
                <Label htmlFor="spotify-url">Spotify URL (Optional)</Label>
                <Input
                  id="spotify-url"
                  placeholder="https://open.spotify.com/episode/..."
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the Spotify episode or track URL
                </p>
              </div>
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

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Session</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateSession(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Create a new session for a mentor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mentor">Select Mentor *</Label>
                <select
                  id="mentor"
                  value={newSession.mentor_id}
                  onChange={(e) => setNewSession({ ...newSession, mentor_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md mt-1"
                >
                  <option value="">Select a mentor...</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  placeholder="Session title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  placeholder="Session description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language *</Label>
                  <Input
                    id="language"
                    value={newSession.language}
                    onChange={(e) => setNewSession({ ...newSession, language: e.target.value })}
                    placeholder="English"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <select
                    id="difficulty"
                    value={newSession.difficulty_level}
                    onChange={(e) => setNewSession({ ...newSession, difficulty_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="youtube_url">YouTube URL (Optional)</Label>
                <Input
                  id="youtube_url"
                  value={newSession.youtube_url}
                  onChange={(e) => setNewSession({ ...newSession, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or video ID"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste YouTube URL or video ID. Can be added later if not available now.
                </p>
                {newSession.youtube_url && !isValidYouTubeUrl(newSession.youtube_url) && (
                  <p className="text-xs text-red-600 mt-1">Invalid YouTube URL format</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={newSession.is_published}
                  onChange={(e) => setNewSession({ ...newSession, is_published: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  Publish immediately
                </Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateSession(false)} disabled={isCreatingSession}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSession} disabled={isCreatingSession || !newSession.mentor_id || !newSession.title || !newSession.description}>
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Session'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Short Videos Management Modal */}
      {showShortVideosModal && selectedSessionForShorts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  <CardTitle>Manage Short Videos</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowShortVideosModal(false);
                    setSelectedSessionForShorts(null);
                    setShortVideos([]);
                    setShowAddShortVideo(false);
                    setEditingShortVideo(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{selectedSessionForShorts.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Add YouTube shorts links that will appear on the session page
                </p>
                <Button onClick={() => setShowAddShortVideo(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Short Video
                </Button>
              </div>

              {loadingShortVideos ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading short videos...</p>
                </div>
              ) : shortVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No short videos yet. Click "Add Short Video" to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {shortVideos.sort((a, b) => a.order_index - b.order_index).map((shortVideo, index) => (
                    <div
                      key={shortVideo.id}
                      className="p-4 border rounded-lg flex items-center gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateShortVideoOrder(shortVideo.id, shortVideo.order_index - 1)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateShortVideoOrder(shortVideo.id, shortVideo.order_index + 1)}
                          disabled={index === shortVideos.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{shortVideo.title}</h4>
                        {shortVideo.description && (
                          <p className="text-sm text-muted-foreground">{shortVideo.description}</p>
                        )}
                        {shortVideo.youtube_video_id && (
                          <div className="mt-2 flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-muted-foreground">
                              {shortVideo.youtube_video_id}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingShortVideo(shortVideo);
                            setNewShortVideo({
                              title: shortVideo.title,
                              description: shortVideo.description || '',
                              youtube_url: shortVideo.video_url || '',
                            });
                            setShowAddShortVideo(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteShortVideo(shortVideo.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Short Video Form */}
              {showAddShortVideo && (
                <Card className="mt-4 border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingShortVideo ? 'Edit Short Video' : 'Add Short Video'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="short-video-title">Title *</Label>
                      <Input
                        id="short-video-title"
                        value={newShortVideo.title}
                        onChange={(e) => setNewShortVideo({ ...newShortVideo, title: e.target.value })}
                        placeholder="Short video title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="short-video-description">Description (Optional)</Label>
                      <Textarea
                        id="short-video-description"
                        value={newShortVideo.description}
                        onChange={(e) => setNewShortVideo({ ...newShortVideo, description: e.target.value })}
                        placeholder="Brief description of the short video"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="short-video-url">YouTube URL or Video ID *</Label>
                      <Input
                        id="short-video-url"
                        value={newShortVideo.youtube_url}
                        onChange={(e) => setNewShortVideo({ ...newShortVideo, youtube_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=... or video ID"
                      />
                      {newShortVideo.youtube_url && !isValidYouTubeUrl(newShortVideo.youtube_url) && (
                        <p className="text-sm text-red-600 mt-1">Invalid YouTube URL format</p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddShortVideo(false);
                          setEditingShortVideo(null);
                          setNewShortVideo({ title: '', description: '', youtube_url: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (editingShortVideo) {
                            // Update existing short video
                            try {
                              const videoId = extractYouTubeVideoId(newShortVideo.youtube_url);
                              await sessionsService.updateShortVideo(editingShortVideo.id, {
                                title: newShortVideo.title,
                                description: newShortVideo.description || undefined,
                                video_type: 'youtube',
                                youtube_video_id: videoId || undefined,
                                video_url: newShortVideo.youtube_url,
                              });
                              toast({
                                title: 'Success',
                                description: 'Short video updated successfully',
                              });
                              setShowAddShortVideo(false);
                              setEditingShortVideo(null);
                              setNewShortVideo({ title: '', description: '', youtube_url: '' });
                              if (selectedSessionForShorts) {
                                await loadShortVideos(selectedSessionForShorts.id);
                              }
                            } catch (error: any) {
                              toast({
                                title: 'Failed to update short video',
                                description: error.message || 'Could not update short video',
                                variant: 'destructive',
                              });
                            }
                          } else {
                            await handleAddShortVideo();
                          }
                        }}
                        disabled={!newShortVideo.title || !newShortVideo.youtube_url || !isValidYouTubeUrl(newShortVideo.youtube_url)}
                      >
                        {editingShortVideo ? 'Update' : 'Add'} Short Video
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminRoute>
  );
}
