"use client";

import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function PrivacyPage() {
  const lang = getLang();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-8">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong>IMPORTANT:</strong> This Privacy Policy describes how bitsbarter ("we," "our," or "us") collects, uses, and shares your personal information when you use our platform. By using our services, you consent to the collection and use of your information as described in this policy.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">1. INFORMATION WE COLLECT</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">1.1 Personal Information</h3>
              <p>We collect the following personal information when you use our platform:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Account Information:</strong> Username, email address, and password when you create an account</li>
                <li><strong>Profile Information:</strong> Profile pictures, location preferences, and verification documents</li>
                <li><strong>Communication Data:</strong> Messages, chat logs, and other communications with other users</li>
                <li><strong>Transaction Information:</strong> Details about listings, purchases, sales, and escrow transactions</li>
                <li><strong>Device Information:</strong> IP address, browser type, device identifiers, and operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns</li>
              </ul>

              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2 mt-4">1.2 Automatically Collected Information</h3>
              <p>We automatically collect certain information through cookies, web beacons, and similar technologies:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Log data and analytics information</li>
                <li>Device and browser information</li>
                <li>Usage patterns and preferences</li>
                <li>Geolocation data (with your consent)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">2. HOW WE USE YOUR INFORMATION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Service Provision:</strong> To provide, maintain, and improve our platform and services</li>
                <li><strong>User Authentication:</strong> To verify your identity and secure your account</li>
                <li><strong>Communication:</strong> To facilitate communication between users and provide customer support</li>
                <li><strong>Transaction Processing:</strong> To process payments, manage escrow services, and resolve disputes</li>
                <li><strong>Safety and Security:</strong> To detect and prevent fraud, abuse, and other harmful activities</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                <li><strong>Analytics and Improvement:</strong> To analyze usage patterns and improve our services</li>
                <li><strong>Marketing:</strong> To send you relevant updates and promotional materials (with your consent)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">3. INFORMATION SHARING AND DISCLOSURE</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:</p>
              
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2 mt-4">3.1 With Other Users</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your username and profile information are visible to other users</li>
                <li>Listing information and transaction details are shared with relevant parties</li>
                <li>Communication content is shared with the intended recipients</li>
              </ul>

              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2 mt-4">3.2 With Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Cloud hosting and infrastructure providers</li>
                <li>Payment processing and escrow service providers</li>
                <li>Analytics and monitoring service providers</li>
                <li>Customer support and communication tools</li>
              </ul>

              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2 mt-4">3.3 Legal Requirements</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>To comply with applicable laws and regulations</li>
                <li>To respond to lawful requests from government authorities</li>
                <li>To protect our rights, property, and safety</li>
                <li>To investigate and prevent fraud or other illegal activities</li>
              </ul>

              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2 mt-4">3.4 Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">4. DATA SECURITY</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>We implement appropriate technical and organizational measures to protect your personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols</li>
                <li><strong>Access Controls:</strong> Strict access controls limit who can access your information</li>
                <li><strong>Regular Audits:</strong> We conduct regular security assessments and penetration testing</li>
                <li><strong>Employee Training:</strong> Our staff receives regular training on data protection and privacy</li>
                <li><strong>Incident Response:</strong> We have procedures in place to respond to security incidents</li>
              </ul>
              <p className="mt-4">However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">5. DATA RETENTION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Account Information:</strong> Retained while your account is active and for a reasonable period after deactivation</li>
                <li><strong>Transaction Data:</strong> Retained for legal and accounting purposes as required by law</li>
                <li><strong>Communication Data:</strong> Retained for safety and dispute resolution purposes</li>
                <li><strong>Analytics Data:</strong> Retained in anonymized form for service improvement</li>
              </ul>
              <p className="mt-4">You may request deletion of your account and associated data, subject to our legal obligations to retain certain information.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">6. YOUR RIGHTS AND CHOICES</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for processing based on consent</li>
              </ul>
              <p className="mt-4">To exercise these rights, please contact us using the information provided at the end of this policy.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">7. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>We use cookies and similar technologies to enhance your experience and analyze platform usage:</p>
              
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2 mt-4">7.1 Types of Cookies</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong>Security Cookies:</strong> Help protect against fraud and abuse</li>
              </ul>

              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2 mt-4">7.2 Cookie Management</h3>
              <p>You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some platform features.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">8. INTERNATIONAL DATA TRANSFERS</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>Your personal information may be transferred to and processed in countries other than your own:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>We ensure that such transfers comply with applicable data protection laws</li>
                <li>We use appropriate safeguards, such as standard contractual clauses, when required</li>
                <li>We maintain the same level of protection for your information regardless of where it is processed</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">9. CHILDREN'S PRIVACY</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>Our platform is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you believe we have collected information from a child under 18, please contact us immediately.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">10. CHANGES TO THIS POLICY</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>We will notify you of material changes through the platform or by email</li>
                <li>Your continued use of our services after changes become effective constitutes acceptance</li>
                <li>We encourage you to review this policy periodically</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">11. CONTACT INFORMATION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mt-4">
                <p><strong>Email:</strong> privacy@bitsbarter.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@bitsbarter.com</p>
                <p><strong>Address:</strong> bitsbarter Privacy Team, Toronto, Ontario, Canada</p>
                <p><strong>Phone:</strong> +1 (416) XXX-XXXX</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">12. COMPLAINTS</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>If you believe we have not addressed your privacy concerns adequately, you may have the right to lodge a complaint with the relevant data protection authority in your jurisdiction.</p>
            </div>
          </section>

          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 mt-8">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


