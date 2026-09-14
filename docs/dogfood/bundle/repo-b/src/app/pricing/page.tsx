import HeroSection from '@/components/hero-section-1'
import FAQs from '@/components/faqs-1'
import { LogoWall } from '@/components/jhai/LogoWall'
import { RecordBand } from '@/components/jhai/RecordBand'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'

const pricingTiers = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for individuals and small teams',
    features: ['Up to 5 projects', 'Basic analytics', 'Community support', '1GB storage'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: 79,
    description: 'For growing teams and businesses',
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      '100GB storage',
      'Team collaboration',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 249,
    description: 'For large-scale operations',
    features: [
      'Everything in Professional',
      'Dedicated support',
      'Unlimited storage',
      'SSO & security',
      'Custom contracts',
      'API access',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const logos = [
  {
    src: 'https://api.svgl.app/logo?name=vercel',
    alt: 'Vercel',
  },
  {
    src: 'https://api.svgl.app/logo?name=github',
    alt: 'GitHub',
  },
  {
    src: 'https://api.svgl.app/logo?name=stripe',
    alt: 'Stripe',
  },
  {
    src: 'https://api.svgl.app/logo?name=spotify',
    alt: 'Spotify',
  },
  {
    src: 'https://api.svgl.app/logo?name=supabase',
    alt: 'Supabase',
  },
  {
    src: 'https://api.svgl.app/logo?name=nextjs',
    alt: 'Next.js',
  },
]

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '150+', label: 'Countries' },
  { value: '24/7', label: 'Support' },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Pricing Table */}
      <section className="py-16 md:py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Always flexible to scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`flex flex-col p-8 ${
                  tier.highlighted ? 'ring-2 ring-primary relative' : ''
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-6 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground mb-6 text-sm">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>

                <Link
                  href="#"
                  className={`inline-flex w-full h-9 items-center justify-center rounded-lg font-medium mb-8 transition-all ${
                    tier.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                      : 'border border-border bg-background hover:bg-muted'
                  }`}
                >
                  {tier.cta}
                </Link>

                <ul className="space-y-4 flex-1">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Logo Wall */}
      <LogoWall logos={logos} label="Trusted by leading companies" />

      {/* Stats Band */}
      <RecordBand stats={stats} standalone={true} />

      {/* FAQ Section */}
      <FAQs />
    </main>
  )
}
