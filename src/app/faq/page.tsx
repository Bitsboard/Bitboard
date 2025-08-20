import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function FAQPage() {
    const lang = getLang();

    const faqCategories = [
        {
            title: "Getting Started",
            icon: "🚀",
            questions: [
                {
                    question: "How do I create an account?",
                    answer: "Click the 'Sign In' button in the header and choose 'Create Account'. You'll need to provide a username, email, and password. We also support social login options for convenience."
                },
                {
                    question: "Is bitsbarter free to use?",
                    answer: "Yes, creating an account and browsing listings is completely free. There are only fees when using the Lightning escrow service for transactions (typically 1-2%)."
                },
                {
                    question: "Do I need a Bitcoin wallet?",
                    answer: "Yes, you'll need a Lightning Network compatible Bitcoin wallet to use the escrow service and make payments. Popular options include Phoenix, Breez, and Muun."
                }
            ]
        },
        {
            title: "Buying & Selling",
            icon: "💰",
            questions: [
                {
                    question: "How do I create a listing?",
                    answer: "Click 'Post a listing' in the header, fill out the form with details about your item or service, set your price in sats or BTC, add photos, and publish. Your listing will be visible to users in your area."
                },
                {
                    question: "How do I contact a seller?",
                    answer: "Click on any listing and use the 'Message seller' button. This opens our in-app chat where you can discuss details, negotiate price, and coordinate meetups safely."
                },
                {
                    question: "Can I negotiate prices?",
                    answer: "Absolutely! Use the in-app chat to negotiate with sellers. Many sellers are open to offers, especially for items that have been listed for a while."
                }
            ]
        },
        {
            title: "Lightning Escrow",
            icon: "⚡",
            questions: [
                {
                    question: "How does Lightning escrow work?",
                    answer: "When you agree to buy something, the buyer sends Bitcoin to a Lightning escrow smart contract. The funds are held securely until the buyer confirms receipt of the item, then automatically released to the seller."
                },
                {
                    question: "What if there's a problem with my purchase?",
                    answer: "If there's an issue, contact our support team immediately. The escrow funds remain locked until both parties reach an agreement or we mediate the dispute based on evidence provided."
                },
                {
                    question: "Are escrow fees refundable?",
                    answer: "Escrow fees are non-refundable as they cover the Lightning Network transaction costs and platform maintenance. However, if a transaction is cancelled before funds are sent to escrow, no fees are charged."
                }
            ]
        },
        {
            title: "Safety & Security",
            icon: "🔒",
            questions: [
                {
                    question: "Is it safe to meet with strangers?",
                    answer: "We recommend meeting in public places during daylight hours. Always verify the other person's identity through our verification system and use the in-app chat to coordinate. Never share personal contact information outside the app."
                },
                {
                    question: "What should I do if I feel unsafe?",
                    answer: "Trust your instincts. If you feel unsafe at any point, leave immediately and contact our support team. We take safety seriously and will investigate any reported incidents."
                },
                {
                    question: "How do I report suspicious activity?",
                    answer: "Use the 'Report' button on any listing or contact our support team directly. We investigate all reports and take appropriate action to maintain a safe community."
                }
            ]
        },
        {
            title: "Technical Issues",
            icon: "🛠️",
            questions: [
                {
                    question: "The app isn't loading properly",
                    answer: "Try refreshing the page or clearing your browser cache. If the problem persists, check your internet connection and try using a different browser. Contact support if issues continue."
                },
                {
                    question: "I can't upload photos to my listing",
                    answer: "Make sure your photos are in JPG, PNG, or WebP format and under 10MB each. If you're still having issues, try using a different browser or device."
                },
                {
                    question: "My Lightning payment failed",
                    answer: "Check that your Lightning wallet has sufficient funds and is properly connected. Network congestion can sometimes cause delays. If the issue persists, contact our support team."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        Find answers to the most common questions about using bitsbarter
                    </p>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-12">
                    {faqCategories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 border border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-lg">{category.icon}</span>
                                </div>
                                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                    {category.title}
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {category.questions.map((faq, faqIndex) => (
                                    <div key={faqIndex} className="border-b border-neutral-200 dark:border-neutral-700 pb-6 last:border-b-0 last:pb-0">
                                        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-3">
                                            {faq.question}
                                        </h3>
                                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Still Have Questions */}
                <div className="text-center mt-16">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                        Still Have Questions?
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Can't find the answer you're looking for? Our support team is here to help.
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
                            Visit Help Center
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
