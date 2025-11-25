import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Award, CheckCircle, BookOpen, Languages as LanguagesIcon } from 'lucide-react';
import { mentorsService, sessionsService, type Mentor, type Session } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';

export default function MentorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMentor();
      loadMentorSessions();
    }
  }, [id]);

  const loadMentor = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await mentorsService.getMentorById(id);
      setMentor(data);
    } catch (error: any) {
      toast({
        title: 'Error Loading Mentor',
        description: error.message || 'Failed to load mentor',
        variant: 'destructive',
      });
      navigate('/mentors');
    } finally {
      setLoading(false);
    }
  };

  const loadMentorSessions = async () => {
    if (!id) return;
    try {
      const data = await sessionsService.getAllSessions({ mentor_id: id, limit: 20 });
      setSessions(data);
    } catch (error: any) {
      console.error('Failed to load mentor sessions:', error);
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
              <p className="text-muted-foreground">Loading mentor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/mentors')} className="mb-4">
          ← Back to Mentors
        </Button>

        <Card className="mb-8 animate-fade-in">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {mentor.photo_url ? (
                <img
                  src={mentor.photo_url}
                  alt={mentor.full_name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-16 w-16 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  {mentor.full_name}
                  {mentor.verification_status === 'verified' && (
                    <CheckCircle className="h-6 w-6 text-primary" />
                  )}
                </h1>
                {mentor.bio && (
                  <p className="text-muted-foreground mb-4">{mentor.bio}</p>
                )}
                {mentor.domains && mentor.domains.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.domains.map((domain, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mentor Sessions</CardTitle>
              <CardDescription>
                Explore content from this mentor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-smooth"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <h4 className="font-semibold mb-2">{session.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {session.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{session.duration_minutes} min</span>
                      <span>{session.language}</span>
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

