import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, Plus, X, Loader2 } from 'lucide-react';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { mentorsService, Mentor } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function MentorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    domains: [] as string[],
    specialties: [] as string[],
    languages: [] as string[],
    achievements: [] as string[],
    photo_url: '',
  });
  const [domainInput, setDomainInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');

  useEffect(() => {
    if (user?.role === 'mentor') {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await mentorsService.getMentorProfile();
      setProfile(data);
      setFormData({
        bio: data.bio || '',
        domains: data.domains || [],
        specialties: data.specialties || [],
        languages: data.languages || [],
        achievements: data.achievements || [],
        photo_url: data.photo_url || '',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to load profile',
        description: error.message || 'Could not load mentor profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await mentorsService.updateMentorProfile(formData);
      toast({
        title: 'Profile updated',
        description: 'Your mentor profile has been updated successfully',
      });
      loadProfile();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addArrayItem = (field: 'domains' | 'specialties' | 'languages' | 'achievements', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
    if (field === 'domains') setDomainInput('');
    if (field === 'specialties') setSpecialtyInput('');
    if (field === 'languages') setLanguageInput('');
    if (field === 'achievements') setAchievementInput('');
  };

  const removeArrayItem = (field: 'domains' | 'specialties' | 'languages' | 'achievements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'mentor') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You need to be a mentor to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Update your mentor profile information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your bio, domains, specialties, and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div>
              <Label>Domains</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addArrayItem('domains', domainInput);
                    }
                  }}
                  placeholder="Add domain (press Enter)"
                />
                <Button type="button" onClick={() => addArrayItem('domains', domainInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.domains.map((domain, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1">
                    {domain}
                    <button onClick={() => removeArrayItem('domains', idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Specialties</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addArrayItem('specialties', specialtyInput);
                    }
                  }}
                  placeholder="Add specialty (press Enter)"
                />
                <Button type="button" onClick={() => addArrayItem('specialties', specialtyInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specialties.map((specialty, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1">
                    {specialty}
                    <button onClick={() => removeArrayItem('specialties', idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Languages</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addArrayItem('languages', languageInput);
                    }
                  }}
                  placeholder="Add language (press Enter)"
                />
                <Button type="button" onClick={() => addArrayItem('languages', languageInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.languages.map((lang, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm flex items-center gap-1">
                    {lang}
                    <button onClick={() => removeArrayItem('languages', idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Achievements</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addArrayItem('achievements', achievementInput);
                    }
                  }}
                  placeholder="Add achievement (press Enter)"
                />
                <Button type="button" onClick={() => addArrayItem('achievements', achievementInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.achievements.map((achievement, idx) => (
                  <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm flex items-center gap-1">
                    {achievement}
                    <button onClick={() => removeArrayItem('achievements', idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

