import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Hudey",
  description: "Hudey Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-10"
        >
          <span>&larr;</span> Back to Hudey
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: February 2025</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using Hudey (&quot;the Service&quot;), operated by Hudey (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              Hudey is an AI-powered marketing platform that automates influencer campaign management, including creator discovery, outreach, negotiation, and campaign tracking. The Service is provided on a subscription basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <p>
              You must create an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration and to update such information to keep it current.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Send unsolicited or unauthorized communications through the Service</li>
              <li>Attempt to interfere with, compromise, or disrupt the Service</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Use the Service to send deceptive, misleading, or fraudulent outreach</li>
              <li>Impersonate any person or entity while using the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Payment Terms</h2>
            <p>
              Paid subscriptions are billed in advance on a recurring basis. All fees are non-refundable except as expressly set forth in our <Link href="/refund" className="text-indigo-600 hover:underline">Refund Policy</Link>. We reserve the right to change our pricing with 30 days&apos; notice. Payment processing is handled by Paddle, our Merchant of Record, and you agree to Paddle&apos;s Checkout Buyer Terms when making payments.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p>
              The Service, including all content, features, and functionality, is owned by Hudey and is protected by copyright, trademark, and other intellectual property laws. You retain ownership of any content you submit through the Service, but grant us a licence to use it as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Data and Privacy</h2>
            <p>
              Your use of the Service is subject to our <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Service Availability</h2>
            <p>
              We strive to maintain the availability of the Service but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the Service (or any part thereof) at any time with reasonable notice. We shall not be liable for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Hudey shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill, whether arising from contract, tort, or otherwise, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violation of these terms. You may cancel your account at any time through your account settings. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will provide notice of material changes by posting the updated terms on our website. Your continued use of the Service after such changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:support@hudey.com" className="text-indigo-600 hover:underline">support@hudey.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
