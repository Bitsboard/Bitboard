"use client";

import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function TermsPage() {
  const lang = getLang();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Terms and Conditions of Service
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-8">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong>IMPORTANT:</strong> Please read these Terms and Conditions of Service ("Terms") carefully before using the bitsbarter platform. By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you must not use our services.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">1. DEFINITIONS</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p><strong>"Platform"</strong> refers to the bitsbarter website, mobile applications, and related services operated by bitsbarter.</p>
              <p><strong>"User"</strong> refers to any individual or entity that accesses or uses the Platform.</p>
              <p><strong>"Service"</strong> refers to the local classifieds marketplace and Lightning Network escrow services provided through the Platform.</p>
              <p><strong>"Content"</strong> refers to any information, data, text, images, or other materials posted, uploaded, or transmitted through the Platform.</p>
              <p><strong>"Transaction"</strong> refers to any purchase, sale, or exchange facilitated through the Platform.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">2. ACCEPTANCE OF TERMS</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>2.1. By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
              <p>2.2. These Terms constitute a legally binding agreement between you and bitsbarter.</p>
              <p>2.3. bitsbarter reserves the right to modify these Terms at any time. Continued use of the Platform after such modifications constitutes acceptance of the updated Terms.</p>
              <p>2.4. You must be at least 18 years old to use the Platform. By using the Platform, you represent and warrant that you meet this age requirement.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">3. DESCRIPTION OF SERVICES</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>3.1. The Platform provides a local classifieds marketplace where users can buy, sell, and exchange goods and services using Bitcoin through the Lightning Network.</p>
              <p>3.2. The Platform includes an integrated Lightning Network escrow service designed to facilitate secure transactions between buyers and sellers.</p>
              <p>3.3. The Platform provides communication tools, including in-app messaging, to facilitate negotiations and coordination between users.</p>
              <p>3.4. bitsbarter acts as an intermediary platform and is not a party to any transactions between users.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">4. USER ACCOUNTS AND REGISTRATION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>4.1. To access certain features of the Platform, you must create an account and provide accurate, current, and complete information.</p>
              <p>4.2. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              <p>4.3. You must immediately notify bitsbarter of any unauthorized use of your account or any other breach of security.</p>
              <p>4.4. bitsbarter reserves the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">5. USER CONDUCT AND PROHIBITED ACTIVITIES</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>5.1. You agree to use the Platform only for lawful purposes and in accordance with these Terms.</p>
              <p>5.2. You are strictly prohibited from:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Posting false, misleading, or fraudulent information</li>
                <li>Engaging in any form of harassment, discrimination, or abusive behavior</li>
                <li>Attempting to circumvent the Platform's security measures</li>
                <li>Using the Platform for any illegal activities or to facilitate illegal transactions</li>
                <li>Interfering with the proper functioning of the Platform</li>
                <li>Attempting to gain unauthorized access to other users' accounts or information</li>
                <li>Using the Platform to distribute malware, viruses, or other harmful code</li>
              </ul>
              <p>5.3. Violation of these provisions may result in immediate account termination and legal action.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">6. LIGHTNING NETWORK ESCROW SERVICE</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>6.1. The Lightning Network escrow service is designed to provide secure transactions by holding funds until both parties confirm completion.</p>
              <p>6.2. Users acknowledge that Lightning Network transactions are irreversible and subject to the inherent risks of cryptocurrency transactions.</p>
              <p>6.3. bitsbarter charges a fee for escrow services, which is clearly disclosed before each transaction.</p>
              <p>6.4. In the event of disputes, bitsbarter may mediate based on evidence provided by both parties, but final resolution is the responsibility of the users.</p>
              <p>6.5. Users acknowledge that Lightning Network transactions may be subject to network congestion and other technical limitations.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">7. INTELLECTUAL PROPERTY RIGHTS</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>7.1. The Platform and its original content, features, and functionality are owned by bitsbarter and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
              <p>7.2. You retain ownership of any content you post on the Platform, but you grant bitsbarter a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content.</p>
              <p>7.3. You may not use bitsbarter's trademarks, service marks, or logos without prior written consent.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">8. PRIVACY AND DATA PROTECTION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>8.1. Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Platform.</p>
              <p>8.2. By using the Platform, you consent to the collection, use, and disclosure of your information as described in our Privacy Policy.</p>
              <p>8.3. bitsbarter implements appropriate technical and organizational measures to protect your personal data.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">9. DISCLAIMER OF WARRANTIES</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>9.1. THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>
              <p>9.2. bitsbarter disclaims all warranties, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Warranties of merchantability and fitness for a particular purpose</li>
                <li>Warranties that the Platform will be uninterrupted or error-free</li>
                <li>Warranties regarding the accuracy, reliability, or completeness of any information</li>
                <li>Warranties that defects will be corrected</li>
              </ul>
              <p>9.3. bitsbarter does not warrant that the Platform will meet your specific requirements or that the Platform will be secure or free from viruses or other harmful components.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">10. LIMITATION OF LIABILITY</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>10.1. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, bitsbarter SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
              <p>10.2. bitsbarter's total liability to you for any claims arising from or relating to these Terms or your use of the Platform shall not exceed the amount you paid to bitsbarter in the twelve (12) months preceding the claim.</p>
              <p>10.3. The limitations of liability set forth in this section shall apply even if bitsbarter has been advised of the possibility of such damages.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">11. INDEMNIFICATION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>11.1. You agree to indemnify, defend, and hold harmless bitsbarter and its officers, directors, employees, agents, and affiliates from and against any claims, damages, losses, costs, and expenses arising from:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Your content posted on the Platform</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">12. GOVERNING LAW AND JURISDICTION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>12.1. These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario, Canada.</p>
              <p>12.2. Any disputes arising from or relating to these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of the Province of Ontario, Canada.</p>
              <p>12.3. You agree to submit to the personal jurisdiction of such courts and waive any objections to venue or forum non conveniens.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">13. SEVERABILITY</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>13.1. If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.</p>
              <p>13.2. The failure of bitsbarter to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">14. ENTIRE AGREEMENT</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>14.1. These Terms, together with our Privacy Policy and any other agreements referenced herein, constitute the entire agreement between you and bitsbarter regarding the Platform.</p>
              <p>14.2. These Terms supersede all prior or contemporaneous communications, whether electronic, oral, or written, between you and bitsbarter.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">15. CONTACT INFORMATION</h2>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <p>If you have any questions about these Terms, please contact us at:</p>
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mt-4">
                <p><strong>Email:</strong> legal@bitsbarter.com</p>
                <p><strong>Address:</strong> bitsbarter Legal Department, Toronto, Ontario, Canada</p>
              </div>
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
