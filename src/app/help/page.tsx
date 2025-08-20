import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function HelpPage() {
    const lang = getLang();

    const faqs = [
        {
            question: "How does Lightning escrow work?",
            answer: "Lightning escrow uses smart contracts on the Bitcoin Lightning Network to hold funds securely until both parties complete the transaction. The buyer sends Bitcoin to the escrow, and once they confirm receipt of the item, the funds are automatically released to the seller."
        },
        {
            question: "What if there's a dispute?",
            answer: "In case of disputes, our support team can mediate. The escrow funds remain locked until both parties reach an agreement or we make a determination based on evidence provided."
        },
        {
            question: "Are there fees for using escrow?",
            answer: "Yes, there's a small fee (typically 1-2%) for using the escrow service. This covers the Lightning Network transaction costs and platform maintenance."
        },
        {
            question: "How do I create a listing?",
            answer: "Click the 'Post a listing' button in the header, fill out the form with details about your item or service, set your price in sats or BTC, and publish. Your listing will be visible to users in your area."
        },
        {
            question: "Is it safe to meet with strangers?",
            answer: "We recommend meeting in public places during daylight hours. Always verify the other person's identity through our verification system and use the in-app chat to coordinate meetups. Never share personal contact information outside the app."
        },
        {
            question: "What payment methods are accepted?",
            answer: "We only accept Bitcoin payments through the Lightning Network. This ensures fast, secure, and low-fee transactions. You'll need a Lightning wallet to use the platform."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                        Help Center
                    </h1>
                    <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        Find answers to common questions and learn how to use bitsbarter
                    </p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <a
                        href="/escrow"
                        className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200"
                    >
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-white text-xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                            Lightning Escrow
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Learn how our secure escrow system works
                        </p>
                    </a>

                    <a
                        href="/safety"
                        className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                    >
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-white text-xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                            Safety Tips
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Stay safe when buying and selling
                        </p>
                    </a>

                    <a
                        href="/contact"
                        className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
                    >
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-white text-xl">💬</span>
                        </div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                            Contact Support
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Get help from our support team
                        </p>
                    </a>
                </div>

                {/* FAQ Section */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800"
                            >
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                                    {faq.question}
                                </h3>
                                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Getting Started Guide */}
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                        Getting Started
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
                                For Buyers
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                                <li>Browse listings in your area</li>
                                <li>Use filters to find what you need</li>
                                <li>Contact sellers through in-app chat</li>
                                <li>Agree on terms and use escrow</li>
                                <li>Meet safely and complete the transaction</li>
                            </ol>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
                                For Sellers
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                                <li>Create a detailed listing</li>
                                <li>Set your price in Bitcoin</li>
                                <li>Respond to buyer inquiries</li>
                                <li>Coordinate safe meetups</li>
                                <li>Receive payment through escrow</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Still Need Help */}
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                        Still Need Help?
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                        >
                            Contact Support
                        </a>
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
