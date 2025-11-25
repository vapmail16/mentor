import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Award, Languages as LanguagesIcon, CheckCircle } from 'lucide-react';
import { mentorsService, type Mentor } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AppNavigation from '@/components/layout/AppNavigation';

export default function Mentors() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      setLoading(true);
      const data = await mentorsService.getAllMentors({ verification_status: 'verified' });
      setMentors(data);
    } catch (error: any) {
      toast({
        title: 'Error Loading Mentors',
        description: error.message || 'Failed to load mentors',
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
          <h1 className="text-3xl font-bold mb-2">Our Mentors</h1>
          <p className="text-muted-foreground">
            Learn from verified industry experts and professionals
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading mentors...</p>
            </div>
          </div>
        ) : mentors.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No mentors available</h3>
            <p className="text-muted-foreground">Check back soon</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card
                key={mentor.id}
                className="hover:shadow-elegant transition-smooth cursor-pointer animate-scale-in"
                onClick={() => navigate(`/mentors/${mentor.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {mentor.photo_url ? (
                      <img
                        src={mentor.photo_url}
                        alt={mentor.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {mentor.full_name}
                        {mentor.verification_status === 'verified' && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </CardTitle>
                      {mentor.bio && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {mentor.bio}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {mentor.domains && mentor.domains.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Domains</p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.domains.slice(0, 3).map((domain, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button className="w-full" variant="outline">
                    View Profile
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

