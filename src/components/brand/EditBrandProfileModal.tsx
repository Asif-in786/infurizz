"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Edit3, X, Check } from "lucide-react";

interface EditBrandProfileModalProps {
  brandId: string;
  initialData: {
    companyName: string;
    industry?: string | null;
    location?: string | null;
    website?: string | null;
    budgetRange?: string | null;
    description?: string | null;
    logoUrl?: string | null;
  };
}

export function EditBrandProfileModal({ brandId, initialData }: EditBrandProfileModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState(initialData.companyName || "");
  const [industry, setIndustry] = useState(initialData.industry || "Audio & Consumer Electronics");
  const [location, setLocation] = useState(initialData.location || "");
  const [website, setWebsite] = useState(initialData.website || "");
  const [budgetRange, setBudgetRange] = useState(initialData.budgetRange || "$5,000 - $15,000");
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          industry,
          location,
          website,
          budgetRange,
          logoUrl,
          description,
        }),
      });

      if (res.ok) {
        setStatusMessage("Brand profile updated successfully!");
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 600);
      } else {
        const data = await res.json();
        setStatusMessage(`Error: ${data.error || "Failed to update"}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs font-medium gap-1.5 cursor-pointer"
      >
        <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
        <span>Edit Profile</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="w-full max-w-lg border border-zinc-200 bg-white p-6 space-y-4 shadow-2xl rounded-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs text-zinc-500 font-medium">
                  Brand Configuration
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-0.5">
                  Update Brand Profile
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 text-xs font-medium flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#E90000]" />
                <span>{statusMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Industry</label>
                  <input
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Budget Range</label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    placeholder="e.g. $5,000 - $15,000"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-700 font-medium">Logo URL</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-700 font-medium">Company Description & Mission</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
