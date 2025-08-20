import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function CareersPage() {
  const lang = getLang();

  // Currently no open positions, but we're always looking for talent

  const benefits = [
    {
      title: "Bitcoin-First Culture",
      description: "Work for a company that truly believes in Bitcoin as the future of money. Get paid in Bitcoin if you prefer."
    },
    {
      title: "Remote-First",
      description: "Work from anywhere in Canada. We believe in results, not office hours."
    },
    {
      title: "Learning & Development",
      description: "Continuous learning opportunities, conference attendance, and access to the latest Bitcoin and Lightning Network developments."
    },
    {
      title: "Competitive Compensation",
      description: "Competitive salary, equity options, and Bitcoin bonuses based on company performance."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Join the Bitcoin Revolution
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Help us build the future of local commerce powered by Bitcoin
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
            Our Mission
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            At bitsbarter, we're building a world where local commerce is powered by sound money. 
            We believe that Bitcoin and the Lightning Network represent the future of financial transactions, 
            and we're committed to making this technology accessible to everyone.
          </p>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Our team is passionate about Bitcoin, privacy, and financial sovereignty. We're looking for 
            individuals who share our vision and want to help build the infrastructure for a more 
            decentralized and equitable financial system.
          </p>
        </div>

                {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
            Join Our Team
          </h2>
          
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-12 border border-neutral-200 dark:border-neutral-800 text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
              No Current Open Positions
            </h3>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6 max-w-2xl mx-auto">
              While we don't have any specific roles open at the moment, we're always looking for forward-thinking talent 
              who are passionate about Bitcoin and building the future of decentralized commerce.
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              If you believe you could contribute to our mission, we encourage you to send us your resume. 
              We're particularly interested in individuals with experience in:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              <div className="text-left">
                <ul className="space-y-2 text-neutral-700 dark:text-neutral-300">
                  <li>• Bitcoin & Lightning Network</li>
                  <li>• Full-stack development</li>
                  <li>• Product management</li>
                  <li>• Community building</li>
                </ul>
              </div>
              <div className="text-left">
                <ul className="space-y-2 text-neutral-700 dark:text-neutral-300">
                  <li>• Fintech & marketplaces</li>
                  <li>• Security & cryptography</li>
                  <li>• UX/UI design</li>
                  <li>• Marketing & growth</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:careers@bitsbarter.com"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
              >
                Send Your Resume
              </a>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
            Why Work With Us
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800"
              >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Application Process */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
            Application Process
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-lg font-bold">1</span>
              </div>
              <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Apply</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Submit your application with resume and cover letter
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-lg font-bold">2</span>
              </div>
              <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Interview</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Technical and cultural fit discussions
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-lg font-bold">3</span>
              </div>
              <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Join</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Welcome to the Bitcoin revolution!
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
            Don't See the Right Role?
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            We're always looking for talented individuals who are passionate about Bitcoin. 
            Send us your resume and let's discuss how you can contribute to our mission.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
            >
              Contact Us
            </a>
            <a
              href="mailto:careers@bitsbarter.com"
              className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
            >
              Send Resume
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
