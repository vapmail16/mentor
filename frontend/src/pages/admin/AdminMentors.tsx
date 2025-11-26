import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users, Search, Loader2, CheckCircle, XCircle, Clock, ExternalLink, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { mentorsService, Mentor } from '@/services/api';
import { adminService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { toast } = useToast();
  
  // Create mentor modal state
  const [showCreateMentor, setShowCreateMentor] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMentor, setNewMentor] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    bio: '',
    domains: [] as string[],
    specialties: [] as string[],
    languages: [] as string[],
    achievements: [] as string[],
  });
  const [domainInput, setDomainInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const result = await mentorsService.getAllMentors({
        verification_status: statusFilter || undefined,
        limit,
        offset,
      });
      const mentorsArray = Array.isArray(result) ? result : (result as any).data || [];
      setMentors(mentorsArray);
    } catch (error: any) {
      toast({
        title: 'Failed to load mentors',
        description: error.message || 'Could not fetch mentors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [offset, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (offset === 0) {
        fetchMentors();
      } else {
        setOffset(0);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [search]);

  const filteredMentors = mentors.filter(mentor => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        mentor.full_name.toLowerCase().includes(searchLower) ||
        mentor.bio?.toLowerCase().includes(searchLower) ||
        mentor.domains.some(d => d.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const handleVerify = async (mentorId: string, status: 'verified' | 'rejected') => {
    try {
      await adminService.updateMentorVerification(mentorId, status);
      toast({
        title: 'Mentor updated',
        description: `Mentor ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      });
      fetchMentors();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update mentor verification',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreateMentor = async () => {
    if (!newMentor.email || !newMentor.password || !newMentor.full_name) {
      toast({
        title: 'Validation Error',
        description: 'Email, password, and full name are required',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await adminService.createUser({
        email: newMentor.email,
        password: newMentor.password,
        full_name: newMentor.full_name,
        role: 'mentor',
        phone: newMentor.phone || undefined,
        mentorProfileData: {
          bio: newMentor.bio || undefined,
          domains: newMentor.domains,
          specialties: newMentor.specialties,
          languages: newMentor.languages,
          achievements: newMentor.achievements,
        },
      });

      toast({
        title: 'Mentor created',
        description: 'Mentor account has been created successfully',
      });

      // Reset form
      setNewMentor({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        bio: '',
        domains: [],
        specialties: [],
        languages: [],
        achievements: [],
      });
      setShowCreateMentor(false);
      fetchMentors();
    } catch (error: any) {
      toast({
        title: 'Create failed',
        description: error.message || 'Could not create mentor',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addArrayItem = (field: 'domains' | 'specialties' | 'languages' | 'achievements', value: string) => {
    if (!value.trim()) return;
    setNewMentor(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
    if (field === 'domains') setDomainInput('');
    if (field === 'specialties') setSpecialtyInput('');
    if (field === 'languages') setLanguageInput('');
    if (field === 'achievements') setAchievementInput('');
  };

  const removeArrayItem = (field: 'domains' | 'specialties' | 'languages' | 'achievements', index: number) => {
    setNewMentor(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <AppNavigation />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Manage Mentors
              </h1>
              <p className="text-muted-foreground">
                Verify and manage mentor accounts ({filteredMentors.length} shown)
              </p>
            </div>
            <Button onClick={() => setShowCreateMentor(true)}>
              <Users className="h-4 w-4 mr-2" />
              Create Mentor
            </Button>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search mentors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mentors</CardTitle>
              <CardDescription>List of all mentor applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMentors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No mentors found</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Mentor</th>
                          <th className="text-left p-2">Domains</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMentors.map((mentor) => (
                          <tr key={mentor.id} className="border-b">
                            <td className="p-2">
                              <div className="font-medium">{mentor.full_name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {mentor.bio || 'No bio'}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {mentor.domains.slice(0, 2).map((domain, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    {domain}
                                  </span>
                                ))}
                                {mentor.domains.length > 2 && (
                                  <span className="px-2 py-1 text-xs text-muted-foreground">
                                    +{mentor.domains.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(mentor.verification_status)}
                                <span
                                  className={`px-2 py-1 rounded text-sm capitalize ${
                                    mentor.verification_status === 'verified'
                                      ? 'bg-green-100 text-green-800'
                                      : mentor.verification_status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {mentor.verification_status}
                                </span>
                              </div>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(mentor.created_at)}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Link to={`/mentors/${mentor.id}`}>
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {mentor.verification_status !== 'verified' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVerify(mentor.id, 'verified')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {mentor.verification_status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVerify(mentor.id, 'rejected')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {mentors.length >= limit && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setOffset(offset + limit)}
                        disabled={mentors.length < limit}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>

      {/* Create Mentor Modal */}
      {showCreateMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Mentor</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateMentor(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Create a new mentor account with profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMentor.email}
                    onChange={(e) => setNewMentor({ ...newMentor, email: e.target.value })}
                    placeholder="mentor@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newMentor.password}
                    onChange={(e) => setNewMentor({ ...newMentor, password: e.target.value })}
                    placeholder="Min 12 characters"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={newMentor.full_name}
                    onChange={(e) => setNewMentor({ ...newMentor, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newMentor.phone}
                    onChange={(e) => setNewMentor({ ...newMentor, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={newMentor.bio}
                  onChange={(e) => setNewMentor({ ...newMentor, bio: e.target.value })}
                  placeholder="Brief introduction about the mentor"
                  rows={3}
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
                  {newMentor.domains.map((domain, idx) => (
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
                  {newMentor.specialties.map((specialty, idx) => (
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
                  {newMentor.languages.map((lang, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm flex items-center gap-1">
                      {lang}
                      <button onClick={() => removeArrayItem('languages', idx)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateMentor(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMentor} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Mentor'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminRoute>
  );
}
