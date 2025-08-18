"use client";

import React, { useState } from "react";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalCloseButton } from "./Modal";
import { t, useLang } from "@/lib/i18n";

type Category =
  | "Featured"
  | "Electronics"
  | "Mining Gear"
  | "Home & Garden"
  | "Sports & Bikes"
  | "Tools"
  | "Games & Hobbies"
  | "Furniture"
  | "Services";

type Seller = {
  name: string;
  score: number;
  deals: number;
  rating: number;
  verifications: { email?: boolean; phone?: boolean; lnurl?: boolean };
  onTimeRelease: number;
};

type Listing = {
  id: string;
  title: string;
  desc: string;
  priceSats: number;
  category: Category | Exclude<string, never>;
  location: string;
  lat: number;
  lng: number;
  type: "sell" | "want";
  images: string[];
  boostedUntil: number | null;
  seller: Seller;
  createdAt: number;
};

interface NewListingModalProps {
  onClose: () => void;
  onPublish: (l: Listing) => void;
  dark: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatSats(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm">{label}</span>
      {children}
    </label>
  );
}

export function NewListingModal({ onClose, onPublish, dark }: NewListingModalProps) {
  const [step, setStep] = useState(1);
  const [boost, setBoost] = useState(false);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    priceSats: 0,
    category: "Electronics" as Category,
    location: "Toronto, ON",
    lat: 43.653,
    lng: -79.383,
    imageUrl: "",
    type: "sell" as "sell" | "want",
  });
  const listingFee = 500; // sats
  const boostFee = 2000; // sats (24h)
  const total = listingFee + (boost ? boostFee : 0);
  const fakeInvoice = `lnbc${total}n1p${Math.random().toString(36).slice(2, 10)}...`;
  const inputBase = dark
    ? "border-neutral-800 bg-neutral-900 text-neutral-100 placeholder-neutral-500 focus:border-orange-500"
    : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-orange-500";

  return (
    <Modal open={true} onClose={onClose} dark={dark} size="md" ariaLabel="Post a listing">
      <ModalHeader dark={dark}>
        <ModalTitle>Post a listing</ModalTitle>
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
      {step === 1 && (
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="e.g., Antminer S19j Pro 100TH" />
            </Field>
            <Field label="Ad type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "sell" | "want" })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)}>
                <option value="sell">{t('selling', useLang())}</option>
                <option value="want">{t('looking_for', useLang())}</option>
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={4} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="Condition, accessories, pickup preferences, etc." />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)}>
                {["Electronics", "Mining Gear", "Home & Garden", "Sports & Bikes", "Tools", "Games & Hobbies", "Furniture", "Services"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Location (neighbourhood/city)">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="e.g., North York, ON" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lat">
              <input type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} />
            </Field>
            <Field label="Lng">
              <input type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Price (sats)">
              <input type="number" min={0} value={form.priceSats} onChange={(e) => setForm({ ...form, priceSats: Number(e.target.value || 0) })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="e.g., 5200000" />
            </Field>
            <Field label="Photo URL (temporary for demo)">
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="Paste an image URL" />
            </Field>
          </div>
          <div className={cn("rounded-xl p-3 text-xs", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-400" : "border border-neutral-300 bg-white text-neutral-600")}>
            All coordination happens in in-app chat. Keep correspondence in-app; off-app contact is against our guidelines.
          </div>
          <div className={cn("flex items-center justify-between rounded-xl p-3", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} />
              <span>
                Boost for 24h on homepage <span className="font-semibold text-orange-500">( + {formatSats(2000)} sats )</span>
              </span>
            </label>
            <span className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>More views, faster responses</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
              Listing fee: <span className={cn("font-semibold", dark ? "text-neutral-200" : "text-neutral-900")}>{formatSats(500)} sats</span>
            </span>
            <button
              onClick={() => setStep(2)}
              disabled={!form.title || !form.priceSats}
              className={cn(
                "rounded-xl px-5 py-3 font-semibold transition",
                !form.title || !form.priceSats
                  ? dark
                    ? "cursor-not-allowed bg-neutral-800 text-neutral-600"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-500"
                  : "bg-orange-500 text-neutral-950 shadow shadow-orange-500/30 hover:bg-orange-400"
              )}
            >
              Continue to listing fee
            </button>
          </div>
        </ModalBody>
      )}
      {step === 2 && (
        <ModalBody className="space-y-4">
          <h3 className="text-base font-semibold">Pay to publish</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={cn("rounded-xl p-4", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
              <p className={cn("text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>
                Send <span className="font-bold text-orange-500">{formatSats(total)} sats</span> to the Lightning invoice below:
              </p>
              <div className={cn("mt-3 rounded-lg p-3 text-xs", dark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>
                {fakeInvoice}
              </div>
              <p className={cn("mt-3 text-xs", dark ? "text-neutral-500" : "text-neutral-600")}>
                * Demo invoice. In production, generate BOLT11/lnurl via your LN backend.
              </p>
            </div>
            <div className={cn("rounded-xl p-4 text-sm", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
              <p className={cn(dark ? "text-neutral-300" : "text-neutral-700")}>Summary</p>
              <ul className="mt-2 space-y-1 opacity-90">
                <li className="flex justify-between">
                  <span>Ad type</span>
                  <span>{form.type === "sell" ? t('selling', useLang()) : t('looking_for', useLang())}</span>
                </li>
                <li className="flex justify-between">
                  <span>Listing fee</span>
                  <span>{formatSats(500)} sats</span>
                </li>
                {boost && (
                  <li className="flex justify-between">
                    <span>Boost (24h)</span>
                    <span>{formatSats(2000)} sats</span>
                  </li>
                )}
                <li className="mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-orange-500">{formatSats(total)} sats</span>
                </li>
              </ul>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => setStep(1)} className={cn("rounded-xl px-4 py-2", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}>
                  Back
                </button>
                <button
                  onClick={() => {
                    const newItem: Listing = {
                      id: "temp",
                      title: form.title.trim(),
                      desc: form.desc.trim(),
                      priceSats: Number(form.priceSats) || 0,
                      category: form.category,
                      location: form.location.trim() || "Toronto, ON",
                      lat: form.lat,
                      lng: form.lng,
                      images: form.imageUrl
                        ? [form.imageUrl]
                        : ["https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=1600&auto=format&fit=crop"],
                      boostedUntil: boost ? Date.now() + 1000 * 60 * 60 * 24 : 0,
                      seller: {
                        name: "@you",
                        score: 0,
                        deals: 0,
                        rating: 5.0,
                        verifications: { email: true },
                        onTimeRelease: 1.0,
                      },
                      createdAt: Date.now(),
                      type: form.type,
                    };
                    onPublish(newItem);
                  }}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 font-semibold text-neutral-950 shadow shadow-orange-500/30 hover:from-amber-300 hover:to-orange-400"
                >
                  I've paid — Publish
                </button>
              </div>
            </div>
          </div>
        </ModalBody>
      )}
    </Modal>
  );
}
