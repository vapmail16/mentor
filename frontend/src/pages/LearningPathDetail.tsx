import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, CheckCircle, Play } from 'lucide-react';
import { learningPathsService, type LearningPath } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';

export default function LearningPathDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLearningPath();
    }
  }, [id]);

  const loadLearningPath = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await learningPathsService.getLearningPathById(id);
      setPath(data);
    } catch (error: any) {
      toast({
        title: 'Error Loading Learning Path',
        description: error.message || 'Failed to load learning path',
        variant: 'destructive',
      });
      navigate('/learning-paths');
    } finally {
      setLoading(false);
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
              <p className="text-muted-foreground">Loading learning path...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!path) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/learning-paths')} className="mb-4">
          ← Back to Learning Paths
        </Button>

        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">{path.title}</h1>
          <p className="text-muted-foreground mb-4">{path.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {path.estimated_hours} hours
            </div>
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              {path.difficulty_level}
            </div>
          </div>
          {path.user_progress && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Your Progress</span>
                <span className="font-medium">{path.user_progress.progress_percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${path.user_progress.progress_percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {path.sessions && path.sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sessions in this Path</CardTitle>
              <CardDescription>
                Complete all sessions to earn a certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {path.sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-smooth"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-muted-foreground">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold">{session.title}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{session.duration_minutes} min</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Watch
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

