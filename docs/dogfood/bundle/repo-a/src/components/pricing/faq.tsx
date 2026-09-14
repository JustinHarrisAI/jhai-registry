"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "All plans include a 14-day free trial with full access to all features. No credit card required.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, and wire transfers for enterprise plans.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer:
      "Yes, annual billing gets you 2 months free. Contact our sales team for custom quotes.",
  },
  {
    question: "Is my data secure?",
    answer:
      "We use industry-standard encryption and comply with SOC 2, GDPR, and HIPAA regulations.",
  },
  {
    question: "What if I need custom features?",
    answer:
      "Enterprise customers can work with our team to develop custom integrations and features.",
  },
];

export function FAQ() {
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-32 lg:px-8 bg-slate-50">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to know about our pricing and plans.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-lg bg-white overflow-hidden"
            >
              <button
                onClick={() => setOpenId(openId === idx ? null : idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-slate-600 transition-transform flex-shrink-0 ${
                    openId === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openId === idx && (
                <div className="px-6 pb-4 text-slate-600 border-t border-slate-100">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
