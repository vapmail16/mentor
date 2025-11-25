import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function Pricing() {
  const { user } = useAuth();

  const plans = [
    {
      name: 'Monthly',
      price: 499,
      period: 'month',
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
      features: [
        'All Monthly features',
        'Student discount',
        'Valid student ID required',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
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
                  disabled={!user}
                >
                  {user ? 'Subscribe Now' : 'Sign Up to Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

