import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { qaService, type Question } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface QAProps {
  sessionId: string;
}

export default function QA({ sessionId }: QAProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [sessionId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await qaService.getSessionQuestions(sessionId);
      setQuestions(data);
    } catch (error: any) {
      toast({
        title: 'Error Loading Questions',
        description: error.message || 'Failed to load questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user) return;

    try {
      await qaService.createQuestion(sessionId, newQuestion.trim());
      setNewQuestion('');
      loadQuestions();
      toast({
        title: 'Question Posted',
        description: 'Your question has been posted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post question',
        variant: 'destructive',
      });
    }
  };

  const handleVote = async (questionId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to vote',
        variant: 'destructive',
      });
      return;
    }

    try {
      await qaService.vote(questionId, undefined, voteType);
      loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to vote',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Questions & Answers ({questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Ask a question about this session..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
            />
            <Button type="submit" disabled={!newQuestion.trim()}>
              Post Question
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading questions...</p>
        ) : questions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No questions yet. Be the first to ask a question!
          </p>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(question.id, 'upvote')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{question.upvotes - question.downvotes}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(question.id, 'downvote')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {question.user?.full_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(question.created_at).toLocaleDateString()}
                      </span>
                      {question.is_answered && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm mb-3">{question.question}</p>
                    {question.answers && question.answers.length > 0 && (
                      <div className="space-y-2 mt-3 pl-4 border-l-2">
                        {question.answers.map((answer) => (
                          <div key={answer.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {answer.user?.full_name || 'Anonymous'}
                                {answer.is_mentor_answer && (
                                  <span className="ml-2 text-xs text-primary">Mentor</span>
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{answer.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
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

