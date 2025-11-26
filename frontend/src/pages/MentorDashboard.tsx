import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Eye, MessageSquare, BookOpen, ArrowLeft, 
  Loader2, BarChart3, Users, Activity
} from 'lucide-react';
import { mentorsService, type Mentor, type MentorAnalytics } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';

export default function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Mentor | null>(null);
  const [analytics, setAnalytics] = useState<MentorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'mentor') {
      navigate('/dashboard');
      return;
    }
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profileData, analyticsData] = await Promise.all([
        mentorsService.getMentorProfile(),
        mentorsService.getMentorProfile().then(profile => 
          mentorsService.getMentorAnalytics(profile.id)
        ),
      ]);
      setProfile(profileData);
      setAnalytics(analyticsData);
    } catch (error: any) {
      toast({
        title: 'Error Loading Dashboard',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'mentor') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppNavigation />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your session performance and engagement
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{analytics?.totalSessions ?? 0}</div>
                <BookOpen className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics?.publishedSessions ?? 0} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{analytics?.totalViews ?? 0}</div>
                <Eye className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Published Sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{analytics?.publishedSessions ?? 0}</div>
                <TrendingUp className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Live on platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{analytics?.totalEngagement ?? 0}</div>
                <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Comments + Questions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/sessions')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                My Sessions
              </CardTitle>
              <CardDescription>View and manage your sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Go to Sessions
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/mentor/qa')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Q&A Inbox
              </CardTitle>
              <CardDescription>Answer questions from mentees</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Open Inbox
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription>Update your mentor profile</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        {profile && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{profile.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Verification: <span className={`font-semibold ${
                      profile.verification_status === 'verified' ? 'text-green-600' :
                      profile.verification_status === 'pending' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)}
                    </span>
                  </p>
                </div>
                {profile.verification_status !== 'verified' && (
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Complete Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}


