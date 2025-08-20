import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function EscrowPage() {
    const lang = getLang();

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-16">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-white text-2xl">⚡</span>
                    </div>
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                        Lightning Escrow
                    </h1>
                    <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        Secure your transactions with Bitcoin's Lightning Network escrow service
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                            How It Works
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-sm font-bold">1</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Agree on Terms</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Buyer and seller agree on price, condition, and delivery terms
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-sm font-bold">2</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Fund Escrow</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Buyer sends Bitcoin to the Lightning escrow smart contract
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-sm font-bold">3</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Complete Transaction</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Funds are released to seller once buyer confirms receipt
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                            Benefits
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Secure</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Funds are held securely until both parties are satisfied
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Fast</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Lightning Network ensures instant settlement
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Low Fees</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Minimal transaction costs compared to traditional escrow
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 text-center">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Create a listing or browse existing ones to experience secure Bitcoin trading
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                        >
                            Browse Listings
                        </a>
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                        >
                            Post a Listing
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
