"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Package } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import { readJsonResponse } from "@/lib/read-json-response";

type UpgradeCheckoutProps = {
  eventPublicId: string;
  appUserId: string;
  publicApiKey?: string;
  userEmail: string;
};

type ActivateResponse = {
  error?: string;
};

export function UpgradeCheckout({
  eventPublicId,
  appUserId,
  publicApiKey,
  userEmail,
}: UpgradeCheckoutProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [status, setStatus] = useState<
    "loading" | "ready" | "purchasing" | "activating" | "error"
  >(publicApiKey ? "loading" : "error");
  const [error, setError] = useState<string | undefined>(
    publicApiKey
      ? undefined
      : "Billing is not configured yet. Set NEXT_PUBLIC_REVENUECAT_WEB_API_KEY to enable checkout.",
  );

  useEffect(() => {
    if (!publicApiKey) {
      return;
    }

    let cancelled = false;

    async function loadOfferings() {
      try {
        const purchases = Purchases.configure({
          apiKey: publicApiKey!,
          appUserId,
        });
        const offerings = await purchases.getOfferings();
        const available = offerings.current?.availablePackages ?? [];

        if (cancelled) {
          return;
        }

        if (available.length === 0) {
          setStatus("error");
          setError(
            "No packages are configured in RevenueCat yet. Add a product to the current offering.",
          );
          return;
        }

        setPackages(available);
        setStatus("ready");
      } catch (loadError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load billing packages.",
          );
        }
      }
    }

    void loadOfferings();

    return () => {
      cancelled = true;
    };
  }, [appUserId, publicApiKey]);

  async function purchase(rcPackage: Package) {
    setStatus("purchasing");
    setError(undefined);

    try {
      const purchases = Purchases.getSharedInstance();
      await purchases.purchase({
        rcPackage,
        customerEmail: userEmail,
      });
    } catch (purchaseError) {
      setStatus("ready");
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Purchase did not complete.",
      );
      return;
    }

    setStatus("activating");

    const response = await fetch(`/api/events/${eventPublicId}/activate`, {
      method: "POST",
    });

    if (response.ok) {
      router.push(`/dashboard/events/${eventPublicId}`);
      router.refresh();
      return;
    }

    const body = await readJsonResponse<ActivateResponse>(response);
    setStatus("ready");
    setError(
      body?.error ??
        "Payment went through but activation failed — refresh and try Go live again.",
    );
  }

  if (status === "loading") {
    return <p className="text-sm text-ink-muted">Loading plans…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {packages.map((rcPackage) => {
        const product = rcPackage.webBillingProduct;

        return (
          <button
            className="flex items-center justify-between gap-4 rounded-2xl bg-canvas p-5 text-left ring-1 ring-border transition hover:ring-accent disabled:opacity-60"
            disabled={status === "purchasing" || status === "activating"}
            key={rcPackage.identifier}
            onClick={() => void purchase(rcPackage)}
            type="button"
          >
            <span>
              <span className="block font-semibold text-ink">
                {product.title}
              </span>
              {product.description ? (
                <span className="mt-1 block text-sm text-ink-muted">
                  {product.description}
                </span>
              ) : null}
            </span>
            <span className="text-lg font-bold text-ink">
              {product.currentPrice.formattedPrice}
            </span>
          </button>
        );
      })}

      {status === "purchasing" ? (
        <p className="text-sm text-ink-muted">Completing checkout…</p>
      ) : null}
      {status === "activating" ? (
        <p className="text-sm text-ink-muted">Taking your event live…</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
