import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function SupportPage() {
    const lang = getLang();

    const supportTopics = [
        {
            title: "Account Issues",
            description: "Problems with login, registration, or account settings",
            icon: "👤",
            color: "bg-blue-500"
        },
        {
            title: "Payment Problems",
            description: "Issues with Lightning payments or escrow transactions",
            icon: "⚡",
            color: "bg-orange-500"
        },
        {
            title: "Listing Problems",
            description: "Trouble creating, editing, or managing listings",
            icon: "📝",
            color: "bg-green-500"
        },
        {
            title: "Safety Concerns",
            description: "Report suspicious activity or safety violations",
            icon: "🔒",
            color: "bg-red-500"
        },
        {
            title: "Technical Issues",
            description: "App not working, bugs, or performance problems",
            icon: "🛠️",
            color: "bg-purple-500"
        },
        {
            title: "General Questions",
            description: "Other questions about using the platform",
            icon: "❓",
            color: "bg-gray-500"
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                        Support Center
                    </h1>
                    <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        Get the help you need to use bitsbarter effectively and safely
                    </p>
                </div>

                {/* Support Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {supportTopics.map((topic, index) => (
                        <div
                            key={index}
                            className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200"
                        >
                            <div className={`w-12 h-12 ${topic.color} rounded-lg flex items-center justify-center mb-4`}>
                                <span className="text-white text-xl">{topic.icon}</span>
                            </div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                {topic.title}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                {topic.description}
                            </p>
                            <a
                                href="/contact"
                                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                            >
                                Get Help →
                            </a>
                        </div>
                    ))}
                </div>

                {/* Priority Support */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-8 mb-16 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xl">🚨</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                                Urgent Safety Issues
                            </h2>
                            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                                If you're experiencing a safety concern or urgent issue, please contact us immediately.
                                We prioritize safety-related support requests and will respond as quickly as possible.
                            </p>
                            <a
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
                            >
                                Contact Support Now
                            </a>
                        </div>
                    </div>
                </div>

                {/* Self-Service Resources */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
                        Self-Service Resources
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                                Help Center
                            </h3>
                            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                                Browse our comprehensive help articles and tutorials to find answers to common questions.
                            </p>
                            <a
                                href="/help"
                                className="inline-flex items-center justify-center px-4 py-2 border border-orange-600 text-orange-600 font-medium rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                            >
                                Visit Help Center
                            </a>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                                Safety Guidelines
                            </h3>
                            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                                Learn about our safety practices and tips for staying secure when buying and selling.
                            </p>
                            <a
                                href="/safety"
                                className="inline-flex items-center justify-center px-4 py-2 border border-orange-600 text-orange-600 font-medium rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                            >
                                View Safety Tips
                            </a>
                        </div>
                    </div>
                </div>

                {/* Response Times */}
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                        Expected Response Times
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-xl">🚨</span>
                            </div>
                            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Safety Issues</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Within 2 hours
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-xl">⚡</span>
                            </div>
                            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Payment Issues</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Within 4 hours
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-xl">📧</span>
                            </div>
                            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">General Support</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Within 24 hours
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Options */}
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                        Need More Help?
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Our support team is ready to assist you with any questions or concerns.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                        >
                            Contact Support
                        </a>
                        <a
                            href="/help"
                            className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                        >
                            Browse Help Center
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
