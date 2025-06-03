import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for individuals and small projects',
    features: [
      'Up to 3 database connections',
      'Basic file processing',
      '1GB data transfer/month',
      'Community support',
      'Basic analytics',
      'Daily backups'
    ],
    cta: 'Get Started',
    href: '/signup',
    featured: false
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'Best for growing teams and businesses',
    features: [
      'Unlimited database connections',
      'Advanced file processing',
      '10GB data transfer/month',
      'Priority support',
      'Advanced analytics',
      'Hourly backups',
      'API access',
      'Custom workflows'
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
    featured: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom needs',
    features: [
      'Everything in Professional',
      'Unlimited data transfer',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'On-premise deployment',
      'Custom security features',
      'Training & onboarding'
    ],
    cta: 'Contact Sales',
    href: '/contact',
    featured: false
  }
];

const Pricing: React.FC = () => {
  return (
    <div className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Choose the plan that's right for you. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl ${
                tier.featured
                  ? 'bg-gradient-to-b from-purple-500/20 to-blue-500/20 border border-purple-500/20'
                  : 'bg-gray-800/50'
              } p-8`}
            >
              {tier.featured && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-3 py-1 text-sm font-medium text-white text-center">
                  Most Popular
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                <p className="mt-4 text-gray-400">{tier.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  {tier.period && (
                    <span className="text-gray-400">{tier.period}</span>
                  )}
                </p>
                <ul className="mt-8 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                      <p className="ml-3 text-gray-400">{feature}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  to={tier.href}
                  className={`block w-full rounded-lg px-4 py-2 text-center text-sm font-semibold ${
                    tier.featured
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  } transition-colors`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h3 className="text-2xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="bg-gray-800/50 p-6 rounded-2xl">
              <h4 className="text-lg font-semibold text-white mb-2">
                Can I change plans later?
              </h4>
              <p className="text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-2xl">
              <h4 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-400">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-2xl">
              <h4 className="text-lg font-semibold text-white mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-400">
                Yes, all paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-2xl">
              <h4 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-gray-400">
                Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 