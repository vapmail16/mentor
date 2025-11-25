import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Brain, Users, Award, TrendingUp, MessageSquare, Clock } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: "Expert Mentorship",
      description: "Learn from industry veterans through long-form interviews and curated video content"
    },
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Multilingual transcripts, summaries, and key learnings powered by advanced AI"
    },
    {
      icon: Users,
      title: "Verified Mentors",
      description: "Connect with verified professionals and industry experts across various domains"
    },
    {
      icon: Award,
      title: "Certified Paths",
      description: "Follow structured learning paths and earn certificates to showcase your expertise"
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics and progress tracking"
    },
    {
      icon: Clock,
      title: "Learn Anytime",
      description: "Access content on-demand with offline downloads and flexible learning schedules"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Mentor Platform
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/pricing")}>
                Pricing
              </Button>
              {user ? (
                <Button className="gradient-primary" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/login")}>
                    Login
                  </Button>
                  <Button className="gradient-primary" onClick={() => navigate("/register")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Learn from Industry Experts
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                AI-Powered Mentorship Platform
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Access long-form interviews, short videos, AI-powered transcripts, and curated learning paths from top professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button
                  size="lg"
                  className="gradient-primary text-lg px-8"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="gradient-primary text-lg px-8"
                    onClick={() => navigate("/register")}
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8"
                    onClick={() => navigate("/pricing")}
                  >
                    View Pricing
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comprehensive Learning Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to learn from experts and advance your career
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-elegant transition-smooth cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-start space-y-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Sessions" },
              { value: "100+", label: "Mentors" },
              { value: "50+", label: "Learning Paths" },
              { value: "10K+", label: "Learners" }
            ].map((stat, index) => (
              <div key={index} className="text-center space-y-2 animate-scale-in">
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 text-center gradient-card border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are advancing their careers with expert mentorship
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="gradient-primary text-lg px-8"
                onClick={() => navigate(user ? "/dashboard" : "/register")}
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                onClick={() => navigate("/pricing")}
              >
                View Pricing
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold">Mentor Platform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Mentor Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
