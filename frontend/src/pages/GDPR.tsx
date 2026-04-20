export default function GDPR() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-white mb-4">GDPR Notice</h1>
      <p className="text-gray-400 mb-10">Last updated: February 18, 2026</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. Scope</h2>
          <p>
            This notice applies to processing of personal data under the General Data Protection Regulation (EU)
            2016/679 for users in the EU/EEA.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. Lawful Bases</h2>
          <p>
            TrainerOS processes personal data based on contract performance, legitimate interests, legal obligations,
            and consent where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Your GDPR Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right of access</li>
            <li>Right to rectification</li>
            <li>Right to erasure</li>
            <li>Right to restriction of processing</li>
            <li>Right to data portability</li>
            <li>Right to object</li>
            <li>Right to withdraw consent</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. Data Processing Requests</h2>
          <p>
            To exercise your rights, contact{' '}
            <a href="mailto:privacy@traineros.org" className="text-brand-500">privacy@traineros.org</a>. We may
            request identity verification before completing your request.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. Processors and Transfers</h2>
          <p>
            We use third-party processors for hosting, authentication, AI processing, and billing. Where required, we
            use GDPR-compliant contractual safeguards for cross-border transfers.
          </p>
        </section>
      </div>
    </div>
  );
}
