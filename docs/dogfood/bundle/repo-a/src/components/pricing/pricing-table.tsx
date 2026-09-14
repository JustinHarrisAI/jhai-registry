import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for trying it out",
    features: [
      "Up to 100 users",
      "Basic analytics",
      "Email support",
      "5 GB storage",
      "Community access",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing teams",
    features: [
      "Up to 1,000 users",
      "Advanced analytics",
      "Priority support",
      "100 GB storage",
      "Custom integrations",
      "API access",
      "Team management",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large organizations",
    features: [
      "Unlimited users",
      "Custom analytics",
      "24/7 dedicated support",
      "Unlimited storage",
      "White-label options",
      "Advanced security",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export function PricingTable() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border transition-all ${
                tier.highlighted
                  ? "border-blue-500 bg-blue-50/50 shadow-lg ring-1 ring-blue-500/20"
                  : "border-slate-200 bg-white"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
                    Most popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{tier.description}</p>

                <div className="mt-6">
                  <span className="text-5xl font-bold text-slate-900">
                    {tier.price}
                  </span>
                  <span className="ml-2 text-slate-600">{tier.period}</span>
                </div>

                <Button
                  className={`mt-8 w-full rounded-lg py-2 text-base font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {tier.cta}
                </Button>

                <div className="mt-8 space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
