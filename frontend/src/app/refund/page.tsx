import Link from "next/link";

export const metadata = {
  title: "Refund Policy | Hudey",
  description: "Hudey Refund Policy",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-10"
        >
          <span>&larr;</span> Back to Hudey
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: February 2025</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Subscription Refunds</h2>
            <p>
              Hudey subscriptions are billed in advance on a recurring basis (monthly or annually, depending on your plan). We offer the following refund terms:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Within 14 days of initial purchase:</strong> If you are not satisfied with the Service, you may request a full refund within 14 days of your first subscription payment. This applies to new subscriptions only.</li>
              <li><strong>After 14 days:</strong> Subscription fees are non-refundable after the 14-day period. You may cancel your subscription at any time, and you will retain access to the Service until the end of your current billing period.</li>
              <li><strong>Annual plans:</strong> Annual subscriptions are eligible for a pro-rated refund within 30 days of purchase. After 30 days, annual subscriptions are non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Campaign Credits</h2>
            <p>
              If you have purchased campaign credits or add-ons separately, unused credits may be refunded within 30 days of purchase. Partially used credit packs are not eligible for refunds.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Service Disruptions</h2>
            <p>
              In the event of a significant service disruption that materially impacts your ability to use the Service for more than 48 consecutive hours, we may offer a pro-rated credit or refund for the affected period at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. How to Request a Refund</h2>
            <p>To request a refund:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1.5">
              <li>Email us at <a href="mailto:support@hudey.com" className="text-indigo-600 hover:underline">support@hudey.com</a> with the subject &quot;Refund Request&quot;</li>
              <li>Include your account email and the reason for your refund request</li>
              <li>We will review your request and respond within 3 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Refund Processing</h2>
            <p>
              Approved refunds will be processed to the original payment method within 5&ndash;10 business days. Refunds are issued via Stripe and may take additional time to appear on your statement depending on your payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Cancellation</h2>
            <p>
              You may cancel your subscription at any time through your account settings or by contacting us at{" "}
              <a href="mailto:support@hudey.com" className="text-indigo-600 hover:underline">support@hudey.com</a>.
              Upon cancellation:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>You will retain access to the Service until the end of your current billing period</li>
              <li>No further charges will be applied after cancellation</li>
              <li>Your campaign data will be retained for 30 days after your subscription ends, after which it may be deleted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Exceptions</h2>
            <p>Refunds will not be granted in cases of:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Account termination due to violation of our <Link href="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link></li>
              <li>Dissatisfaction with campaign results, as outcomes depend on external factors beyond our control</li>
              <li>Failure to cancel a subscription before the renewal date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>
              For questions about our refund policy, contact us at{" "}
              <a href="mailto:support@hudey.com" className="text-indigo-600 hover:underline">support@hudey.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
