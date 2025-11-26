import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, CheckCircle, XCircle, Clock, User, BookOpen, 
  Send, Loader2, Filter, Search, ArrowLeft
} from 'lucide-react';
import { qaService, type Question } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { formatDistanceToNow } from 'date-fns';

export default function MentorQAInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('unanswered');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role !== 'mentor') {
      navigate('/dashboard');
      return;
    }
    loadQuestions();
  }, [user, filter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await qaService.getMentorQuestions({
        is_answered: filter === 'all' ? undefined : filter === 'answered',
        limit: 100,
      });
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

  const handleAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an answer',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await qaService.answerQuestion(selectedQuestion.id, answer.trim());
      toast({
        title: 'Answer Posted',
        description: 'Your answer has been posted successfully',
      });
      setAnswer('');
      setSelectedQuestion(null);
      loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post answer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        q.question.toLowerCase().includes(query) ||
        q.session_title?.toLowerCase().includes(query) ||
        q.user_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const unansweredCount = questions.filter(q => !q.is_answered).length;
  const answeredCount = questions.filter(q => q.is_answered).length;

  if (user?.role !== 'mentor') {
    return null;
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
              <MessageSquare className="h-8 w-8 text-primary" />
              Q&A Inbox
            </h1>
            <p className="text-muted-foreground">
              Answer questions from mentees about your sessions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      All ({questions.length})
                    </Button>
                    <Button
                      variant={filter === 'unanswered' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('unanswered')}
                    >
                      Unanswered ({unansweredCount})
                    </Button>
                    <Button
                      variant={filter === 'answered' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('answered')}
                    >
                      Answered ({answeredCount})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading questions...</p>
                </CardContent>
              </Card>
            ) : filteredQuestions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No questions match your search' : 'No questions yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((question) => (
                  <Card
                    key={question.id}
                    className={`cursor-pointer transition-colors ${
                      selectedQuestion?.id === question.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    } ${!question.is_answered ? 'border-l-4 border-l-orange-500' : ''}`}
                    onClick={() => {
                      setSelectedQuestion(question);
                      setAnswer('');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {question.is_answered ? (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            )}
                            <span className="text-sm font-semibold truncate">
                              {question.user_name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm mb-2 line-clamp-2">{question.question}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span className="truncate">{question.session_title || 'Unknown Session'}</span>
                            </div>
                            {question.answer_count !== undefined && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{question.answer_count} answer{question.answer_count !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!question.is_answered && (
                          <div className="flex-shrink-0">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Needs Answer
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Answer Panel */}
          <div className="lg:col-span-1">
            {selectedQuestion ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Answer Question</CardTitle>
                  <CardDescription>
                    {selectedQuestion.session_title || 'Session'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Question</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{selectedQuestion.question}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Asked by {selectedQuestion.user_name || 'Anonymous'} •{' '}
                        {formatDistanceToNow(new Date(selectedQuestion.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="answer">Your Answer</Label>
                    <Textarea
                      id="answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>

                  {selectedQuestion.is_answered && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        This question has already been answered
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedQuestion(null);
                        setAnswer('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAnswer}
                      disabled={!answer.trim() || isSubmitting || selectedQuestion.is_answered}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post Answer
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a question to answer
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

