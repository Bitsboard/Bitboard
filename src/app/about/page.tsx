import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function AboutPage() {
    const lang = getLang();

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-16">
                    <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-white text-3xl">⚡</span>
                    </div>
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                        About bitsbarter
                    </h1>
                    <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        The Bitcoin-native marketplace for local classifieds
                    </p>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
                    <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                        bitsbarter is a revolutionary local classifieds platform built specifically for the Bitcoin ecosystem.
                        We believe that local commerce should be fast, secure, and free from the limitations of traditional
                        payment systems.
                    </p>

                    <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                        Our platform combines the convenience of local classifieds with the power of Bitcoin's Lightning Network,
                        enabling instant, low-fee transactions while maintaining the security and privacy that Bitcoin users expect.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-2xl">🔒</span>
                        </div>
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                            Secure
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Built-in Lightning escrow ensures safe transactions between buyers and sellers
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-2xl">⚡</span>
                        </div>
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                            Fast
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Lightning Network enables instant payments and settlements
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-2xl">🌍</span>
                        </div>
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                            Local
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Connect with people in your community for face-to-face transactions
                        </p>
                    </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                        Our Mission
                    </h2>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        We're building a future where local commerce is powered by sound money. By leveraging Bitcoin's
                        Lightning Network, we're creating a marketplace that's not only more efficient than traditional
                        classifieds but also more aligned with the principles of financial sovereignty and privacy.
                    </p>
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                        Join the Revolution
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Start buying and selling with Bitcoin today
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                    >
                        Get Started
                    </a>
                </div>
            </div>
        </div>
    );
}
