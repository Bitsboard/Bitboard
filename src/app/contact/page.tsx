import { getLang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

export default function ContactPage() {
    const lang = getLang();

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                        Contact Us
                    </h1>
                    <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                        Have questions or need support? We're here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                            Get in Touch
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-lg">📧</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Email</h3>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        support@bitsbarter.com
                                    </p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                        We typically respond within 24 hours
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-lg">💬</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Community</h3>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        Join our community discussions
                                    </p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                        Get help from other users and our team
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-lg">📚</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Documentation</h3>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        Check our help center first
                                    </p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                        Many questions are answered in our guides
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                            <h3 className="font-medium text-neutral-900 dark:text-white mb-3">
                                Business Hours
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                                Saturday: 10:00 AM - 4:00 PM EST<br />
                                Sunday: Closed
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                            Send us a Message
                        </h2>

                        <form className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Subject
                                </label>
                                <select
                                    id="subject"
                                    name="subject"
                                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    required
                                >
                                    <option value="">Select a subject</option>
                                    <option value="general">General Inquiry</option>
                                    <option value="support">Technical Support</option>
                                    <option value="billing">Billing Question</option>
                                    <option value="partnership">Partnership</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 resize-none"
                                    placeholder="Tell us how we can help..."
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
