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
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>
            <p>
              Hudey offers a <strong>30-day money-back guarantee</strong> on all purchases. If you are not satisfied with your purchase for any reason, you can request a full refund within 30 days of the order completion date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Eligibility</h2>
            <p>
              All customers are eligible for a full refund within 30 days of their purchase date. This applies to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Per-campaign purchases</li>
              <li>Add-ons and additional services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">How to Request a Refund</h2>
            <p>To request a refund, please contact us at{" "}
              <a href="mailto:support@hudey.co" className="text-[#2F4538] hover:underline">support@hudey.co</a>{" "}
              with the subject line &quot;Refund Request&quot; and include your account email address.
            </p>
            <p className="mt-2">
              Refund requests are processed by Paddle, our payment provider and Merchant of Record. We aim to respond to all refund requests within 2 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Refund Processing</h2>
            <p>
              Approved refunds will be processed to the original payment method. Please allow 5&ndash;10 business days for the refund to appear on your statement, depending on your payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Cancellation</h2>
            <p>
              You may close your account at any time through your account settings or by contacting us at{" "}
              <a href="mailto:support@hudey.co" className="text-[#2F4538] hover:underline">support@hudey.co</a>.
              Since Hudey uses per-campaign pricing, there are no recurring charges to cancel. You will retain access to your campaign data and dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Provider</h2>
            <p>
              All payments and refunds are processed by{" "}
              <a href="https://www.paddle.com" className="text-[#2F4538] hover:underline" target="_blank" rel="noopener noreferrer">Paddle.com</a>,
              which acts as our Merchant of Record. By making a purchase, you also agree to{" "}
              <a href="https://www.paddle.com/legal/checkout-buyer-terms" className="text-[#2F4538] hover:underline" target="_blank" rel="noopener noreferrer">Paddle&apos;s Checkout Buyer Terms</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
            <p>
              For questions about our refund policy, contact us at{" "}
              <a href="mailto:support@hudey.co" className="text-[#2F4538] hover:underline">support@hudey.co</a>.
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
