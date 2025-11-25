import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, BookOpen, Users } from 'lucide-react';
import { searchService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';

export default function Search() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const data = await searchService.globalSearch(query.trim(), { limit: 20 });
      setResults(data);
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message || 'Failed to perform search',
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
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">
            Search across sessions, mentors, and transcripts
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                placeholder="Search for sessions, mentors, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <SearchIcon className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-6">
            {results.sessions && results.sessions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Sessions ({results.sessions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.sessions.map((session: any) => (
                    <Card
                      key={session.id}
                      className="hover:shadow-elegant transition-smooth cursor-pointer"
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{session.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {session.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results.mentors && results.mentors.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Mentors ({results.mentors.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.mentors.map((mentor: any) => (
                    <Card
                      key={mentor.id}
                      className="hover:shadow-elegant transition-smooth cursor-pointer"
                      onClick={() => navigate(`/mentors/${mentor.id}`)}
                    >
                      <CardHeader>
                        <CardTitle>{mentor.full_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {mentor.bio}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results && (!results.sessions || results.sessions.length === 0) && (!results.mentors || results.mentors.length === 0) && (
              <Card className="p-12 text-center">
                <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">Try a different search query</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

