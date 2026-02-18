import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Hudey",
  description: "Hudey Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-10"
        >
          <span>&larr;</span> Back to Hudey
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: February 2025</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect the following types of information when you use Hudey:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Account Information:</strong> Email address, name, and authentication details when you create an account</li>
              <li><strong>Campaign Data:</strong> Campaign briefs, creator lists, outreach content, and negotiation records you create through the Service</li>
              <li><strong>Usage Data:</strong> Information about how you interact with the Service, including pages viewed, features used, and actions taken</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through Paddle, our Merchant of Record. We do not store your full payment card details</li>
              <li><strong>Device Information:</strong> Browser type, IP address, and device identifiers collected automatically</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process transactions and send related billing information</li>
              <li>Send campaign-related notifications (approval requests, status updates, creator responses)</li>
              <li>Improve and personalise your experience with the Service</li>
              <li>Analyse usage patterns to improve the Service</li>
              <li>Communicate with you about updates, support, and promotional offers</li>
              <li>Detect and prevent fraud or abuse of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Service Providers:</strong> Third-party vendors that help us operate the Service (e.g., Paddle for payments, Supabase for data storage, Vercel for hosting)</li>
              <li><strong>AI Providers:</strong> We use AI services to power campaign features. Campaign data may be processed by these providers to deliver Service functionality</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your personal information, including encryption in transit (TLS), secure authentication, and access controls. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide the Service. Campaign data is retained for the duration of your account. When you delete your account, we will delete or anonymise your personal information within 30 days, except where we are required to retain it for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict certain processing of your data</li>
              <li>Request a portable copy of your data</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@hudey.co" className="text-[#2F4538] hover:underline">privacy@hudey.co</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies and Analytics</h2>
            <p>
              We use Vercel Analytics and Speed Insights to collect anonymised usage data. These tools do not use cookies for tracking. We may use essential cookies for authentication and session management. We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our website and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes are posted constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p>
              For any privacy-related questions or requests, contact us at{" "}
              <a href="mailto:privacy@hudey.co" className="text-[#2F4538] hover:underline">privacy@hudey.co</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <Link href="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
