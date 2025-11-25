import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Home } from 'lucide-react';
import AppNavigation from '@/components/layout/AppNavigation';
import Footer from '@/components/layout/Footer';
import { paymentService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { config } from '@/config';

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);

  // Load Cashfree SDK
  useEffect(() => {
    if (!config.cashfreeAppId) {
      console.warn('Cashfree App ID not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      setCashfreeLoaded(true);
    };
    script.onerror = () => {
      toast({
        title: 'Payment SDK Error',
        description: 'Failed to load payment gateway. Please refresh the page.',
        variant: 'destructive',
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src*="cashfree"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [toast]);

  const plans = [
    {
      name: 'Monthly',
      price: 499,
      period: 'month',
      plan_type: 'monthly' as const,
      features: [
        'Access to all sessions',
        'AI-generated transcripts',
        'English translations',
        'Summaries & key learnings',
        'Audio-only mode',
        'Download content',
      ],
    },
    {
      name: 'Annual',
      price: 4990,
      period: 'year',
      plan_type: 'annual' as const,
      savings: 'Save 17%',
      features: [
        'Everything in Monthly',
        'Priority support',
        'Early access to new content',
        'Certificate generation',
        'Community Q&A access',
      ],
      popular: true,
    },
    {
      name: 'Student',
      price: 299,
      period: 'month',
      plan_type: 'student' as const,
      features: [
        'All Monthly features',
        'Student discount',
        'Valid student ID required',
      ],
    },
  ];

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (!cashfreeLoaded) {
      toast({
        title: 'Payment Gateway Loading',
        description: 'Please wait for the payment gateway to load...',
        variant: 'default',
      });
      return;
    }

    try {
      setLoading(plan.name);
      
      // Create order
      const orderData = await paymentService.createOrder({
        plan_type: plan.plan_type,
        amount: plan.price,
      });

      // Initialize Cashfree Checkout
      const cashfree = (window as any).Cashfree({
        mode: config.cashfreeMode || 'sandbox',
      });

      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_self', // or '_blank' for new tab
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb / Home Link */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground">
              Unlock access to expert mentorship content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? 'border-primary border-2' : ''}
              >
                <CardHeader>
                  {plan.popular && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        POPULAR
                      </span>
                    </div>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">₹{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <div className="text-sm text-green-600 mt-2">{plan.savings}</div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.name || (!cashfreeLoaded && !!user)}
                  >
                    {loading === plan.name
                      ? 'Processing...'
                      : !user
                      ? 'Sign Up to Subscribe'
                      : !cashfreeLoaded
                      ? 'Loading...'
                      : 'Subscribe Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

