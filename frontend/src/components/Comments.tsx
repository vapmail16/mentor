import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Heart, Flag } from 'lucide-react';
import { commentsService, type Comment } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CommentsProps {
  sessionId: string;
}

export default function Comments({ sessionId }: CommentsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [sessionId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentsService.getSessionComments(sessionId);
      // Organize into parent/child structure
      const parents = data.filter(c => !c.parent_id);
      const withReplies = parents.map(parent => ({
        ...parent,
        replies: data.filter(c => c.parent_id === parent.id),
      }));
      setComments(withReplies);
    } catch (error: any) {
      toast({
        title: 'Error Loading Comments',
        description: error.message || 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await commentsService.createComment(sessionId, newComment.trim());
      setNewComment('');
      loadComments();
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      });
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to like comments',
        variant: 'destructive',
      });
      return;
    }

    try {
      await commentsService.toggleLike(commentId);
      loadComments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to like comment',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button type="submit" disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {comment.user?.full_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(comment.id)}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${comment.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                        {comment.like_count}
                      </Button>
                      {comment.replies && comment.replies.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {comment.replies.length} replies
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

