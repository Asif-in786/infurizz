"use client";

import { useActionState, useState } from "react";
import {
  createService,
  updateService,
  toggleServiceStatus,
  deleteService,
  type FormState,
} from "@/lib/actions";
import { PLATFORMS } from "@/lib/options";
import { FormError, inputClass, labelClass, primaryButton, quietButton } from "@/components/form-styles";
import { money } from "@/lib/format";

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  platform: string;
  price: number;
  turnaroundDays: number;
  deliverables: string;
  revisions: number;
  isActive: boolean;
};

export function CreatorServicesManager({ services }: { services: ServiceItem[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeServices = services.filter((s) => s.isActive);
  const inactiveServices = services.filter((s) => !s.isActive);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-serif text-2xl">Services & Packages</h3>
          <p className="mt-1 text-sm text-muted">
            Define clear deliverables, turnaround times, and pricing for brands to book.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd(!showAdd);
            setEditingId(null);
          }}
          className={quietButton}
        >
          {showAdd ? "Cancel" : "+ Add service"}
        </button>
      </div>

      {showAdd ? (
        <div className="border border-ink bg-card p-6">
          <h4 className="font-serif text-xl">Create New Package</h4>
          <p className="mt-1 text-xs text-muted">
            Provide transparent pricing and deliverables so brands know exactly what is included.
          </p>
          <ServiceForm
            mode="create"
            onSuccess={() => setShowAdd(false)}
          />
        </div>
      ) : null}

      {services.length === 0 && !showAdd ? (
        <div className="border border-line bg-card p-6 text-center">
          <p className="font-serif text-xl">No services listed yet.</p>
          <p className="mt-2 text-sm text-muted">
            Add your first package (e.g. 1x Instagram Reel, YouTube Dedicated Review, or UGC Raw Video) to start selling.
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className={`${primaryButton} mt-4`}
          >
            Create first package
          </button>
        </div>
      ) : null}

      {activeServices.length > 0 ? (
        <div>
          <h4 className="text-xs tracking-[0.16em] text-muted uppercase">Active Packages ({activeServices.length})</h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isEditing={editingId === service.id}
                onEdit={() => setEditingId(editingId === service.id ? null : service.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {inactiveServices.length > 0 ? (
        <div>
          <h4 className="text-xs tracking-[0.16em] text-muted uppercase">Inactive / Drafts ({inactiveServices.length})</h4>
          <div className="mt-4 grid gap-4 opacity-75 sm:grid-cols-2">
            {inactiveServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isEditing={editingId === service.id}
                onEdit={() => setEditingId(editingId === service.id ? null : service.id)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ServiceCard({
  service,
  isEditing,
  onEdit,
}: {
  service: ServiceItem;
  isEditing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col justify-between border border-line bg-card p-5">
      {isEditing ? (
        <ServiceForm
          mode="edit"
          service={service}
          onSuccess={onEdit}
        />
      ) : (
        <>
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="border border-line bg-paper px-2 py-0.5 text-xs text-muted">
                {service.platform}
              </span>
              <span className="font-serif text-2xl font-medium">{money(service.price)}</span>
            </div>
            <h4 className="mt-3 font-serif text-xl">{service.title}</h4>
            <p className="mt-2 text-sm leading-6 text-muted">{service.description}</p>
            <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-muted">
              <div>
                <strong className="text-ink">Deliverables:</strong> {service.deliverables}
              </div>
              <div>
                <strong className="text-ink">Turnaround:</strong> {service.turnaroundDays} day{service.turnaroundDays > 1 ? "s" : ""}
              </div>
              <div>
                <strong className="text-ink">Revisions:</strong> {service.revisions} included
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-xs">
            <button
              type="button"
              onClick={onEdit}
              className="text-ink underline underline-offset-4"
            >
              Edit
            </button>
            <div className="flex items-center gap-3">
              <form action={toggleServiceStatus}>
                <input type="hidden" name="serviceId" value={service.id} />
                <button type="submit" className="text-muted hover:text-ink">
                  {service.isActive ? "Deactivate" : "Activate"}
                </button>
              </form>
              <form action={deleteService}>
                <input type="hidden" name="serviceId" value={service.id} />
                <button
                  type="submit"
                  className="text-oxblood hover:underline"
                  onClick={(e) => {
                    if (!confirm("Are you sure you want to delete this service?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ServiceForm({
  mode,
  service,
  onSuccess,
}: {
  mode: "create" | "edit";
  service?: ServiceItem;
  onSuccess: () => void;
}) {
  const actionFn = mode === "create" ? createService : updateService;
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const res = await actionFn(prev, formData);
    if (!res?.error) {
      onSuccess();
    }
    return res;
  }, {} as FormState);

  return (
    <form action={action} className="mt-4 space-y-4">
      {service ? <input type="hidden" name="serviceId" value={service.id} /> : null}

      <label className={labelClass}>
        Package Title
        <input
          className={inputClass}
          name="title"
          defaultValue={service?.title}
          placeholder="e.g. 1x Dedicated Instagram Reel with Spark Rights"
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Platform
          <select className={inputClass} name="platform" defaultValue={service?.platform ?? "Instagram"} required>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
            <option value="UGC / Multi-platform">UGC / Multi-platform</option>
          </select>
        </label>

        <label className={labelClass}>
          Price (USD)
          <input
            className={inputClass}
            type="number"
            min={0}
            step={1}
            name="price"
            defaultValue={service?.price ?? 250}
            required
          />
        </label>

        <label className={labelClass}>
          Turnaround (Days)
          <input
            className={inputClass}
            type="number"
            min={1}
            step={1}
            name="turnaroundDays"
            defaultValue={service?.turnaroundDays ?? 7}
            required
          />
        </label>

        <label className={labelClass}>
          Revisions Included
          <input
            className={inputClass}
            type="number"
            min={0}
            step={1}
            name="revisions"
            defaultValue={service?.revisions ?? 1}
            required
          />
        </label>
      </div>

      <label className={labelClass}>
        Package Description
        <textarea
          className={inputClass}
          name="description"
          rows={3}
          defaultValue={service?.description}
          placeholder="Detailed breakdown of what this package offers and the creative process."
          required
        />
      </label>

      <label className={labelClass}>
        Deliverables Specification
        <input
          className={inputClass}
          name="deliverables"
          defaultValue={service?.deliverables}
          placeholder="e.g. 1x 60s 4K 9:16 Video, Raw B-roll file, Brand tagged in caption"
          required
        />
      </label>

      <FormError error={state?.error} />

      <div className="flex gap-3">
        <button type="button" onClick={onSuccess} className={quietButton}>
          Cancel
        </button>
        <button className={primaryButton} disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Publish Package" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
