import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Filter, Clock, User, Languages } from 'lucide-react';
import { sessionsService, type Session } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sessions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    language: '',
    difficulty_level: '',
    mentor_id: '',
  });

  useEffect(() => {
    loadSessions();
  }, [filters, searchQuery]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionsService.getAllSessions({
        ...filters,
        search: searchQuery || undefined,
        limit: 50,
      });
      setSessions(data);
    } catch (error: any) {
      toast({
        title: 'Error Loading Sessions',
        description: error.message || 'Failed to load sessions',
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
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Browse Sessions</h1>
          <p className="text-muted-foreground">
            Explore mentorship content from industry experts
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="hover:shadow-elegant transition-smooth cursor-pointer animate-scale-in"
                onClick={() => navigate(`/sessions/${session.id}`)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2">{session.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {session.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {session.duration_minutes} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Languages className="h-4 w-4" />
                      {session.language}
                    </div>
                  </div>
                  {session.mentor && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {session.mentor.full_name}
                      </span>
                    </div>
                  )}
                  <Button className="w-full mt-4" variant="outline">
                    Watch Now
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

