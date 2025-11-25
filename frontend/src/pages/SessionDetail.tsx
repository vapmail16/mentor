import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Clock, User, Languages, Download, Share2, 
  FileText, Languages as LanguagesIcon, Lightbulb, List
} from 'lucide-react';
import { sessionsService, type Session, type AIContent } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';
import VideoPlayer from '@/components/VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('video');

  useEffect(() => {
    if (id) {
      loadSession();
      loadAIContent();
    }
  }, [id]);

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

        {/* Video Player Section */}
        {session.main_video_url && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <VideoPlayer
                url={session.main_video_url}
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

          <TabsContent value="video" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Content</CardTitle>
              </CardHeader>
              <CardContent>
                {session.main_video_url ? (
                  <VideoPlayer
                    url={session.main_video_url}
                    onProgress={handleProgress}
                  />
                ) : (
                  <p className="text-muted-foreground">Video not available</p>
                )}
              </CardContent>
            </Card>
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
                <CardTitle>Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                {aiContent?.chapters && aiContent.chapters.length > 0 ? (
                  <div className="space-y-2">
                    {aiContent.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{chapter.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {Math.floor(chapter.start_time / 60)}:{(chapter.start_time % 60).toString().padStart(2, '0')} - {Math.floor(chapter.end_time / 60)}:{(chapter.end_time % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Jump to
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Chapters not available yet</p>
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

