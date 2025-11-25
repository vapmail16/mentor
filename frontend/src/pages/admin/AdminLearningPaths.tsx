import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, GraduationCap, Search, Loader2, Eye, EyeOff, ExternalLink, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { learningPathsService, LearningPath } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminLearningPaths() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  const fetchPaths = async () => {
    setLoading(true);
    try {
      const result = await learningPathsService.getAllLearningPaths({
        is_published: publishedFilter === 'published' ? true : publishedFilter === 'unpublished' ? false : undefined,
        limit,
        offset,
      });
      const pathsArray = Array.isArray(result) ? result : (result as any).data || [];
      setPaths(pathsArray);
    } catch (error: any) {
      toast({
        title: 'Failed to load learning paths',
        description: error.message || 'Could not fetch learning paths',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, [offset, publishedFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (offset === 0) {
        fetchPaths();
      } else {
        setOffset(0);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [search]);

  const filteredPaths = paths.filter(path => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        path.title.toLowerCase().includes(searchLower) ||
        path.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const sessionCount = (path: LearningPath) => {
    return path.sessions?.length || 0;
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
                <GraduationCap className="h-8 w-8 text-primary" />
                Manage Learning Paths
              </h1>
              <p className="text-muted-foreground">
                View and manage all learning paths ({filteredPaths.length} shown)
              </p>
            </div>
            <Link to="/learning-paths">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Path
              </Button>
            </Link>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search learning paths..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={publishedFilter}
                onChange={(e) => setPublishedFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Paths</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Paths</CardTitle>
              <CardDescription>List of all platform learning paths</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPaths.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No learning paths found</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Difficulty</th>
                          <th className="text-left p-2">Sessions</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Created</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPaths.map((path) => (
                          <tr key={path.id} className="border-b">
                            <td className="p-2">
                              <div className="font-medium">{path.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {path.description || 'No description'}
                              </div>
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm capitalize">
                                {path.difficulty_level}
                              </span>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {sessionCount(path)} sessions
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  path.is_published
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {path.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {formatDate(path.created_at)}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Link to={`/learning-paths/${path.id}`}>
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {paths.length >= limit && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Showing {offset + 1} to {Math.min(offset + limit, paths.length)} of {paths.length}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setOffset(offset + limit)}
                        disabled={offset + limit >= paths.length}
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
    </AdminRoute>
  );
}
