import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, BookOpen, Search, Loader2, Eye, EyeOff, 
  ExternalLink, Edit, Youtube, X, Plus, Music
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { sessionsService, type Session, mentorsService, type Mentor } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { extractYouTubeVideoId, isValidYouTubeUrl } from '@/utils/youtube';

export default function MentorSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mentorProfile, setMentorProfile] = useState<Mentor | null>(null);

  // Edit modal state
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Create session modal state
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    language: 'English',
    difficulty_level: 'beginner',
    youtube_url: '',
    spotify_url: '',
    is_published: false,
  });

  useEffect(() => {
    if (user?.role !== 'mentor') {
      navigate('/dashboard');
      return;
    }
    loadMentorProfile();
    loadSessions();
  }, [user]);

  const loadMentorProfile = async () => {
    try {
      const profile = await mentorsService.getMentorProfile();
      setMentorProfile(profile);
    } catch (error: any) {
      console.error('Failed to load mentor profile:', error);
    }
  };

  const loadSessions = async () => {
    if (!mentorProfile) return;
    try {
      setLoading(true);
      const data = await sessionsService.getAllSessions({
        mentor_id: mentorProfile.id,
        search: search || undefined,
        limit: 100,
      });
      const sessionsArray = Array.isArray(data) ? data : (data as any).data || [];
      setSessions(sessionsArray);
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
    if (mentorProfile) {
      loadSessions();
    }
  }, [search, mentorProfile]);

  const handleCreateSession = async () => {
    if (!newSession.title || !newSession.description || !newSession.language) {
      toast({
        title: 'Validation Error',
        description: 'Title, description, and language are required',
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
      await sessionsService.createSession({
        title: newSession.title,
        description: newSession.description,
        language: newSession.language,
        difficulty_level: newSession.difficulty_level,
        video_type: videoId ? 'youtube' : 'upload',
        youtube_video_id: videoId || undefined,
        main_video_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
        audio_file_url: newSession.spotify_url || undefined,
        is_published: newSession.is_published,
      });
      toast({
        title: 'Session Created',
        description: 'Your session has been created successfully',
      });
      setNewSession({
        title: '',
        description: '',
        language: 'English',
        difficulty_level: 'beginner',
        youtube_url: '',
        spotify_url: '',
        is_published: false,
      });
      setShowCreateSession(false);
      loadSessions();
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

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    if (session.main_video_url && session.main_video_url.includes('youtube.com')) {
      setYoutubeUrl(session.main_video_url);
    } else if (session.youtube_video_id) {
      setYoutubeUrl(`https://www.youtube.com/watch?v=${session.youtube_video_id}`);
    } else {
      setYoutubeUrl('');
    }
    setSpotifyUrl(session.audio_file_url && session.audio_file_url.includes('spotify') ? session.audio_file_url : '');
  };

  const handleCloseEdit = () => {
    setEditingSession(null);
    setYoutubeUrl('');
    setSpotifyUrl('');
  };

  const handleSave = async () => {
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
        updates.youtube_video_id = null;
        updates.main_video_url = null;
      }

      if (spotifyUrl) {
        updates.audio_file_url = spotifyUrl;
      } else if (spotifyUrl === '' && editingSession.audio_file_url?.includes('spotify')) {
        updates.audio_file_url = null;
      }

      await sessionsService.updateSession(editingSession.id, updates);
      toast({
        title: 'Session updated',
        description: 'Session links have been updated successfully',
      });
      handleCloseEdit();
      loadSessions();
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

  const handleTogglePublish = async (session: Session) => {
    try {
      await sessionsService.updateSession(session.id, {
        is_published: !session.is_published,
      });
      toast({
        title: 'Session updated',
        description: `Session ${!session.is_published ? 'published' : 'unpublished'} successfully`,
      });
      loadSessions();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update session',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredSessions = sessions.filter(session => {
    if (search) {
      const query = search.toLowerCase();
      return (
        session.title.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (user?.role !== 'mentor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mentor/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              My Sessions
            </h1>
            <p className="text-muted-foreground">
              Manage your mentorship sessions ({filteredSessions.length} total)
            </p>
          </div>
          <Button onClick={() => setShowCreateSession(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No sessions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first session to get started
                </p>
                <Button onClick={() => setShowCreateSession(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Language</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium flex items-center gap-2">
                            {session.title}
                            {session.video_type === 'youtube' && session.youtube_video_id && (
                              <Youtube className="h-4 w-4 text-red-600" title="YouTube video" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {session.description}
                          </div>
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
                              title="Edit links"
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />

      {/* Edit Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  <CardTitle>Edit Video & Audio Links</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{editingSession.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="youtube-url">YouTube URL or Video ID</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=... or video ID"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="mt-1"
                />
                {youtubeUrl && isValidYouTubeUrl(youtubeUrl) && (
                  <p className="text-sm text-green-600 mt-1">✓ Valid YouTube URL</p>
                )}
                {youtubeUrl && !isValidYouTubeUrl(youtubeUrl) && (
                  <p className="text-sm text-red-600 mt-1">✗ Invalid YouTube URL</p>
                )}
              </div>
              <div>
                <Label htmlFor="spotify-url">Spotify URL (Optional)</Label>
                <Input
                  id="spotify-url"
                  placeholder="https://open.spotify.com/episode/..."
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCloseEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || (youtubeUrl && !isValidYouTubeUrl(youtubeUrl))}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
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
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Create New Session
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateSession(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Fill in the details to create a new session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {newSession.youtube_url && !isValidYouTubeUrl(newSession.youtube_url) && (
                  <p className="text-sm text-red-600 mt-1">Invalid YouTube URL format</p>
                )}
              </div>
              <div>
                <Label htmlFor="spotify_url">Spotify URL (Optional)</Label>
                <Input
                  id="spotify_url"
                  value={newSession.spotify_url}
                  onChange={(e) => setNewSession({ ...newSession, spotify_url: e.target.value })}
                  placeholder="https://open.spotify.com/episode/..."
                />
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
                <Button 
                  onClick={handleCreateSession} 
                  disabled={isCreatingSession || !newSession.title || !newSession.description || !newSession.language || (newSession.youtube_url && !isValidYouTubeUrl(newSession.youtube_url))}
                >
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
    </div>
  );
}

