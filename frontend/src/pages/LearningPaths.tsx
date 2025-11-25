import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, Target, ArrowRight } from 'lucide-react';
import { learningPathsService, type LearningPath } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';

export default function LearningPaths() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningPaths();
  }, []);

  const loadLearningPaths = async () => {
    try {
      setLoading(true);
      const data = await learningPathsService.getAllLearningPaths({ is_published: true });
      setPaths(data);
    } catch (error: any) {
      toast({
        title: 'Error Loading Learning Paths',
        description: error.message || 'Failed to load learning paths',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Learning Paths</h1>
          <p className="text-muted-foreground">
            Structured learning journeys curated by experts
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading learning paths...</p>
            </div>
          </div>
        ) : paths.length === 0 ? (
          <Card className="p-12 text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No learning paths available</h3>
            <p className="text-muted-foreground">Check back soon for new paths</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path) => (
              <Card
                key={path.id}
                className="hover:shadow-elegant transition-smooth cursor-pointer animate-scale-in"
                onClick={() => navigate(`/learning-paths/${path.id}`)}
              >
                <CardHeader>
                  <CardTitle>{path.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {path.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {path.estimated_hours} hours
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {path.difficulty_level}
                    </div>
                  </div>
                  {path.user_progress && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
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
                  <Button className="w-full" variant="outline">
                    {path.user_progress ? 'Continue' : 'Start'} Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

