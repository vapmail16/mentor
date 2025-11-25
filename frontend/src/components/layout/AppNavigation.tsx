import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Bell, Settings, LogOut, BookOpen, Award, Users, Search, Shield } from 'lucide-react';
import { authService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AppNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLogout = async () => {
    const { error } = await authService.signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    navigate("/");
  };

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'mentee' || user?.role === 'guest') return '/dashboard';
    if (user?.role === 'mentor') return '/dashboard';
    return '/dashboard';
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate(getDashboardPath())}
            >
              <GraduationCap className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Mentor Platform
              </span>
            </div>
            
            {/* Role-specific navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {user?.role === 'admin' ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/admin')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/sessions')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Sessions
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/learning-paths')}>
                    <Award className="h-4 w-4 mr-2" />
                    Learning Paths
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/mentors')}>
                    <Users className="h-4 w-4 mr-2" />
                    Mentors
                  </Button>
                </>
              ) : user?.role === 'mentee' || user?.role === 'guest' ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/sessions')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Sessions
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/learning-paths')}>
                    <Award className="h-4 w-4 mr-2" />
                    Learning Paths
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/mentors')}>
                    <Users className="h-4 w-4 mr-2" />
                    Mentors
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/search')}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </>
              ) : user?.role === 'mentor' ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/sessions')}>
                    My Sessions
                  </Button>
                </>
              ) : null}
            </nav>
          </div>

          {/* Right side actions */}
          {user && (
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/dashboard")}
                title="Dashboard"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AppNavigation;

