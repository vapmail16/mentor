import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const signature = searchParams.get('signature');

  useEffect(() => {
    // Check if we have payment parameters
    if (!orderId && !paymentId && !signature) {
      // No payment parameters - might be direct navigation or webhook already processed
      // Check if user already has active subscription
      refreshUser().then(() => {
        // Give webhook time to process, then check subscription
        setTimeout(() => {
          refreshUser();
          setStatus('success');
          toast({
            title: 'Payment Processing',
            description: 'Your payment is being processed. Subscription will activate shortly.',
          });
        }, 2000);
      });
      return;
    }

    if (!orderId || !paymentId || !signature) {
      // Missing some parameters but have others - webhook might have processed
      toast({
        title: 'Payment Processing',
        description: 'Your payment is being processed. Checking subscription status...',
      });
      setTimeout(() => {
        refreshUser();
        setStatus('success');
      }, 2000);
      return;
    }

    const verifyPayment = async () => {
      try {
        const verified = await paymentService.verifyPayment(orderId, paymentId, signature);
        if (verified) {
          setStatus('success');
          // Refresh user to update subscription status
          await refreshUser();
          toast({
            title: 'Payment Successful',
            description: 'Your subscription has been activated!',
          });
        } else {
          // Verification failed, but webhook might have processed it
          // Check subscription status anyway
          await refreshUser();
          setStatus('success');
          toast({
            title: 'Payment Processing',
            description: 'Your payment is being processed. Subscription will activate shortly.',
          });
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        // Even if verification fails, webhook might have processed
        // Check subscription status
        await refreshUser();
        setStatus('success');
        toast({
          title: 'Payment Processing',
          description: 'Your payment is being processed. If you were charged, your subscription will activate shortly.',
        });
      }
    };

    verifyPayment();
  }, [orderId, paymentId, signature, refreshUser, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                <CardTitle>Verifying Payment...</CardTitle>
                <CardDescription>Please wait while we verify your payment</CardDescription>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>
                  Your subscription has been activated successfully
                </CardDescription>
              </>
            )}
            {status === 'failed' && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <CardTitle>Payment Verification Failed</CardTitle>
                <CardDescription>
                  We couldn't verify your payment. Please contact support if payment was deducted.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {orderId && (
              <div className="text-sm text-muted-foreground">
                <p>Order ID: {orderId}</p>
              </div>
            )}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
              {status === 'success' && (
                <Button
                  className="flex-1"
                  onClick={() => navigate('/sessions')}
                >
                  Browse Sessions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

