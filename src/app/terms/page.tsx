"use client";

import React, { useState } from "react";
import { LogoMinimal } from "@/components";
import { cn } from "@/lib/utils";

export default function TermsPage() {
    const [dark, setDark] = useState(true);

    return (
        <div className={cn("min-h-screen", dark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900")}>
            <nav className="sticky top-0 z-40 backdrop-blur border-b border-neutral-900 bg-neutral-950/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <LogoMinimal dark={dark} />
                        <span className="text-lg font-extrabold tracking-tight">bitsbarter</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDark(!dark)}
                            className="rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
                        >
                            {dark ? "☀️ Light" : "🌙 Dark"}
                        </button>
                        <a
                            href="/"
                            className="rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
                        >
                            ← Back to Home
                        </a>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-4xl px-4 py-12">
                <div className="prose prose-lg max-w-none">
                    <h1 className="text-4xl font-black mb-8">Terms & Conditions</h1>

                    <div className={cn("rounded-2xl border p-8", dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-300 bg-white")}>
                        <div className="space-y-6 text-base">
                            <section>
                                <h2 className="text-2xl font-bold mb-4">1. General Terms</h2>
                                <p>
                                    By using bitsbarter, you agree to keep all correspondence in-app for safety. Off-app contact may limit our ability to help in disputes.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">2. User Responsibilities</h2>
                                <p>Listings must comply with local laws. You are responsible for ensuring legality and authenticity of items and services.</p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">3. Escrow & Payments</h2>
                                <p>Escrow is provided via Lightning hold invoices. Funds are released only when both parties confirm, or a mediator decides in good faith based on in-app evidence.</p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">4. Prohibited Items</h2>
                                <p>
                                    <strong>Prohibited items</strong> include: weapons, illicit drugs, stolen goods, counterfeit items, recalled/unsafe goods, and anything illegal in your jurisdiction.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">5. Platform Role</h2>
                                <p>We are a venue: transactions are between users. bitsbarter is not a bank and does not custody fiat. Bitcoin price estimates are informational only.</p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">6. Enforcement</h2>
                                <p>Violations of these terms can result in deletion of content and/or account suspension.</p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">7. Safety Guidelines</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Meet in a <strong>very public</strong> place: malls, cafés, or police e-commerce zones.</li>
                                    <li>Bring a friend or tell someone your meeting place and time.</li>
                                    <li>Keep <strong>all correspondence in-app</strong>; off-app contact is against our guidelines.</li>
                                    <li>Inspect items in person; test devices and verify serial numbers.</li>
                                    <li>Prefer <strong>Lightning escrow</strong> over cash; confirm release only when satisfied.</li>
                                    <li>Trust your instincts — if something feels off, walk away and report the listing.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">8. Contact</h2>
                                <p>For questions about these terms, please contact us through the app. Keep all correspondence in-app for safety and record-keeping.</p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <footer className={cn("border-t", dark ? "border-neutral-900 bg-neutral-950/60" : "border-neutral-200 bg-white/70")}>
                <div className="mx-auto max-w-7xl px-4 py-10 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            ⚡ bitsbarter — in-app chat + Lightning escrow. Keep correspondence in-app; off-app
                            contact is against our guidelines.
                        </p>
                        <div className="flex items-center gap-4">
                            <a className="hover:text-orange-600" href="/">
                                Back to Home
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
