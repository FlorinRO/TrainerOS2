export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-white mb-4">PRIVACY POLICY – TRAINEROS</h1>
      <p className="text-gray-400 mb-10">Last updated: February 18, 2026</p>

      <p className="text-gray-300 leading-relaxed mb-10">
        This Privacy Policy explains how SWEVEN S.R.L. (“Company”, “we”, “our”, or “TrainerOS”) collects, uses, and
        protects your personal data when you use the TrainerOS platform.
      </p>

      <div className="space-y-10 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. COMPANY INFORMATION</h2>
          <p>Data Controller:</p>
          <p className="mt-3">
            <strong>SWEVEN S.R.L.</strong>
            <br />
            Registered Office: Str. Principală, Moisei, Maramureș, Romania
            <br />
            Company Registration Number: J24/1022/2023
            <br />
            CUI: 48485881
            <br />
            Email:{' '}
            <a href="mailto:business@traineros.org" className="text-brand-500">
              business@traineros.org
            </a>
          </p>
          <p className="mt-3">
            For any data protection inquiries, please contact us at:{' '}
            <a href="mailto:business@traineros.org" className="text-brand-500">
              business@traineros.org
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. WHAT DATA WE COLLECT</h2>
          <p>We may collect the following categories of personal data:</p>

          <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.1 Account Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Password (encrypted)</li>
            <li>Billing country</li>
            <li>Business-related information you voluntarily provide</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.2 Payment Information</h3>
          <p>Payments are processed via Stripe.</p>
          <p>We do not store full card details. Stripe may collect:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Card information</li>
            <li>Billing address</li>
            <li>Transaction data</li>
          </ul>
          <p className="mt-3">Stripe acts as an independent data controller.</p>
          <p>
            You can review Stripe’s privacy policy at:{' '}
            <a href="https://stripe.com/privacy" className="text-brand-500" target="_blank" rel="noreferrer">
              https://stripe.com/privacy
            </a>
          </p>

          <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.3 Usage Data</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device type</li>
            <li>Pages visited</li>
            <li>Actions within the platform</li>
            <li>Login timestamps</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.4 User Content</h3>
          <p>
            Any content you input into TrainerOS (text, niche information, content drafts, etc.) is stored to provide
            the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. PURPOSE OF PROCESSING</h2>
          <p>We process personal data for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>To create and manage user accounts</li>
            <li>To provide access to the platform</li>
            <li>To process subscription payments</li>
            <li>To improve and optimize the service</li>
            <li>To communicate with users (service updates, support)</li>
            <li>To ensure platform security</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="mt-3">We do not sell personal data.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. LEGAL BASIS FOR PROCESSING (GDPR)</h2>
          <p>Under the General Data Protection Regulation (GDPR), we rely on:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Contractual necessity (to provide the service)</li>
            <li>Legal obligations (accounting, tax compliance)</li>
            <li>Legitimate interests (platform security, service improvement)</li>
            <li>Consent (where required, such as marketing communications)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. DATA RETENTION</h2>
          <p>We retain personal data:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>As long as the account is active</li>
            <li>As required for legal, tax, or accounting purposes</li>
            <li>Until deletion is requested (subject to legal retention obligations)</li>
          </ul>
          <p className="mt-3">
            Upon account termination, data may be deleted or anonymized unless legally required to retain it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6. DATA SHARING</h2>
          <p>We may share personal data with:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Stripe (payment processing)</li>
            <li>Hosting providers (secure cloud infrastructure)</li>
            <li>Analytics providers (if applicable)</li>
            <li>Legal authorities when required by law</li>
          </ul>
          <p className="mt-3">All service providers are bound by confidentiality and data protection obligations.</p>
          <p className="mt-3">We do not sell or rent personal data.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">7. INTERNATIONAL TRANSFERS</h2>
          <p>As an EU-based company, we primarily process data within the European Economic Area (EEA).</p>
          <p className="mt-3">If data is transferred outside the EEA (e.g., via service providers), we ensure appropriate safeguards such as:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Standard Contractual Clauses</li>
            <li>Adequacy decisions</li>
            <li>Secure data processing agreements</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">8. DATA SECURITY</h2>
          <p>We implement technical and organizational security measures, including:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Encrypted connections (HTTPS)</li>
            <li>Secure password hashing</li>
            <li>Access control limitations</li>
            <li>Secure hosting infrastructure</li>
          </ul>
          <p className="mt-3">However, no system is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">9. USER RIGHTS (GDPR)</h2>
          <p>If you are located in the European Union, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion (“right to be forgotten”)</li>
            <li>Restrict processing</li>
            <li>Object to processing</li>
            <li>Request data portability</li>
            <li>Withdraw consent (where applicable)</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p className="mt-3">
            To exercise your rights, contact:{' '}
            <a href="mailto:business@traineros.org" className="text-brand-500">
              business@traineros.org
            </a>
          </p>
          <p className="mt-3">We may request identity verification before fulfilling requests.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">10. MARKETING COMMUNICATIONS</h2>
          <p>We may send service-related emails (e.g., billing notices, updates).</p>
          <p className="mt-3">Marketing emails are sent only with your consent.</p>
          <p>You may unsubscribe at any time using the unsubscribe link.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">11. COOKIES</h2>
          <p>TrainerOS may use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Maintain login sessions</li>
            <li>Improve functionality</li>
            <li>Analyze usage</li>
          </ul>
          <p className="mt-3">You may control cookies through your browser settings.</p>
          <p>A separate Cookie Policy may provide further details.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">12. CHILDREN’S DATA</h2>
          <p>TrainerOS is not intended for individuals under 18 years old.</p>
          <p className="mt-3">We do not knowingly collect personal data from minors.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">13. CHANGES TO THIS POLICY</h2>
          <p>We may update this Privacy Policy periodically.</p>
          <p className="mt-3">
            The updated version will be posted on the website with a revised “Last updated” date.
          </p>
          <p className="mt-3">Continued use of the service constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">14. CONTACT</h2>
          <p>For privacy-related questions:</p>
          <p className="mt-3">
            Email:{' '}
            <a href="mailto:business@traineros.org" className="text-brand-500">
              business@traineros.org
            </a>
            <br />
            Registered Office: Str. Principală, Moisei, Maramureș, Romania
          </p>
        </section>
      </div>

      <p className="text-gray-300 leading-relaxed mt-10">
        By using TrainerOS, you acknowledge that you have read and understood this Privacy Policy.
      </p>
    </div>
  );
}
