import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Clock, User, Languages, Download, Share2, 
  FileText, Languages as LanguagesIcon, Lightbulb, List, Play, Youtube, Music
} from 'lucide-react';
import { sessionsService, type Session, type AIContent } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';
import VideoPlayer from '@/components/VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl, extractYouTubeVideoId } from '@/utils/youtube';
import Comments from '@/components/Comments';
import QA from '@/components/QA';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('video');
  const [mentorSessions, setMentorSessions] = useState<Session[]>([]);
  const [loadingMentorSessions, setLoadingMentorSessions] = useState(false);

  useEffect(() => {
    if (id) {
      loadSession();
      loadAIContent();
    }
  }, [id]);

  useEffect(() => {
    if (session?.mentor_id) {
      loadMentorSessions();
    }
  }, [session?.mentor_id]);

  const loadSession = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await sessionsService.getSessionById(id);
      setSession(data);
    } catch (error: any) {
      toast({
        title: 'Error Loading Session',
        description: error.message || 'Failed to load session',
        variant: 'destructive',
      });
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadAIContent = async () => {
    if (!id) return;
    try {
      const content = await sessionsService.getAIContent(id);
      setAiContent(content);
    } catch (error: any) {
      console.error('Failed to load AI content:', error);
    }
  };

  const loadMentorSessions = async () => {
    if (!session?.mentor_id) return;
    try {
      setLoadingMentorSessions(true);
      const sessions = await sessionsService.getAllSessions({ 
        mentor_id: session.mentor_id,
        limit: 50 
      });
      // Filter out current session
      const otherSessions = sessions.filter(s => s.id !== session.id);
      setMentorSessions(otherSessions);
    } catch (error: any) {
      console.error('Failed to load mentor sessions:', error);
    } finally {
      setLoadingMentorSessions(false);
    }
  };

  const handleProgress = (progress: { played: number; playedSeconds: number }) => {
    if (id && user) {
      sessionsService.trackWatchProgress(id, progress.playedSeconds);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading session...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <Button variant="ghost" onClick={() => navigate('/sessions')} className="mb-4">
            ← Back to Sessions
          </Button>
          <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
          <p className="text-muted-foreground mb-4">{session.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {session.duration_minutes} minutes
            </div>
            <div className="flex items-center gap-1">
              <Languages className="h-4 w-4" />
              {session.language}
            </div>
            {session.mentor && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {session.mentor.full_name}
              </div>
            )}
          </div>
        </div>

        {/* Video Player Section - Show at top for YouTube videos */}
        {(session.main_video_url || session.youtube_video_id) && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <VideoPlayer
                url={
                  session.youtube_video_id
                    ? buildYouTubeWatchUrl(session.youtube_video_id)
                    : session.main_video_url!
                }
                onProgress={handleProgress}
              />
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="learnings">Learnings</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="qa">Q&A</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="mt-6 space-y-6">
            {/* Spotify Audio Link */}
            {session.audio_file_url && session.audio_file_url.includes('spotify') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Audio (Spotify)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => window.open(session.audio_file_url!, '_blank')}
                    className="w-full"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Open on Spotify
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Short Videos */}
            {session.short_videos && session.short_videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-600" />
                    Short Videos
                  </CardTitle>
                  <CardDescription>
                    Quick clips and highlights from this session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {session.short_videos.map((shortVideo) => {
                      const videoUrl = shortVideo.video_type === 'youtube' && shortVideo.youtube_video_id
                        ? buildYouTubeWatchUrl(shortVideo.youtube_video_id)
                        : shortVideo.video_url;
                      const videoId = shortVideo.video_type === 'youtube' && shortVideo.youtube_video_id
                        ? shortVideo.youtube_video_id
                        : null;
                      
                      return (
                        <div
                          key={shortVideo.id}
                          className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            if (videoId) {
                              // Open in YouTube embed in a modal or new tab
                              window.open(videoUrl, '_blank');
                            }
                          }}
                        >
                          {videoId ? (
                            <div className="aspect-video relative">
                              <img
                                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                alt={shortVideo.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
                                <Play className="h-12 w-12 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-muted flex items-center justify-center">
                              <Play className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-3">
                            <h4 className="font-semibold text-sm line-clamp-2">{shortVideo.title}</h4>
                            {shortVideo.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {shortVideo.description}
                              </p>
                            )}
                            {shortVideo.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.floor(shortVideo.duration / 60)}:{(shortVideo.duration % 60).toString().padStart(2, '0')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {aiContent?.summary?.text ? (
                  <p className="whitespace-pre-wrap">{aiContent.summary.text}</p>
                ) : (
                  <p className="text-muted-foreground">Summary not available yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="english">
                  <TabsList>
                    <TabsTrigger value="english">English</TabsTrigger>
                    <TabsTrigger value="original">Original ({session.language})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="english" className="mt-4">
                    {aiContent?.transcript_english?.text ? (
                      <p className="whitespace-pre-wrap">{aiContent.transcript_english.text}</p>
                    ) : (
                      <p className="text-muted-foreground">English transcript not available</p>
                    )}
                  </TabsContent>
                  <TabsContent value="original" className="mt-4">
                    {aiContent?.transcript_original?.text ? (
                      <p className="whitespace-pre-wrap">{aiContent.transcript_original.text}</p>
                    ) : (
                      <p className="text-muted-foreground">Original transcript not available</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learnings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Learnings</CardTitle>
              </CardHeader>
              <CardContent>
                {aiContent?.key_learnings?.learnings && aiContent.key_learnings.learnings.length > 0 ? (
                  <ul className="space-y-2">
                    {aiContent.key_learnings.learnings.map((learning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                        <span>{learning}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Key learnings not available yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chapters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Other Videos from This Mentor</CardTitle>
                <CardDescription>
                  Explore more content from {session.mentor?.full_name || 'this mentor'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMentorSessions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading videos...</p>
                  </div>
                ) : mentorSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mentorSessions.map((mentorSession, index) => (
                      <div
                        key={mentorSession.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/sessions/${mentorSession.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold line-clamp-2 mb-1">{mentorSession.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {mentorSession.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {mentorSession.duration_minutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Languages className="h-3 w-3" />
                                {mentorSession.language}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No other videos available from this mentor yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <Comments sessionId={session.id} />
          </TabsContent>

          <TabsContent value="qa" className="mt-6">
            <QA sessionId={session.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

