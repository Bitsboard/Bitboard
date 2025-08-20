import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function CareersPage() {
  const lang = getLang();

  const openPositions = [
    {
      title: "Senior Full-Stack Developer",
      type: "Full-time",
      location: "Remote (Canada)",
      department: "Engineering",
      description: "Join our core team building the future of Bitcoin commerce. We're looking for experienced developers who are passionate about Bitcoin, Lightning Network, and creating secure, scalable applications."
    },
    {
      title: "Bitcoin/Lightning Network Specialist",
      type: "Full-time",
      location: "Remote (Canada)",
      department: "Engineering",
      description: "Deep expertise in Bitcoin and Lightning Network protocols. Help us build the most secure and efficient escrow system in the Bitcoin ecosystem."
    },
    {
      title: "Product Manager",
      type: "Full-time",
      location: "Remote (Canada)",
      department: "Product",
      description: "Lead product strategy and development for our Bitcoin marketplace. Experience with fintech, marketplaces, or Bitcoin products preferred."
    },
    {
      title: "Community Manager",
      type: "Full-time",
      location: "Remote (Canada)",
      department: "Marketing",
      description: "Build and nurture our Bitcoin community. Experience with Bitcoin communities, social media, and event organization required."
    }
  ];

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
            Open Positions
          </h2>
          
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <div
                key={index}
                className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {position.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        {position.department}
                      </span>
                    </div>
                  </div>
                  <button className="mt-4 md:mt-0 px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200">
                    Apply Now
                  </button>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {position.description}
                </p>
              </div>
            ))}
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
