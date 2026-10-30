import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { bizStore } from '../../lib/bizStore';

interface PublicBusinessGateProps {
  /** Business slug (menu/book/catalog/card links) or business id (tracking links). */
  slugOrId: string;
  /** Single private document the visitor may read by its unguessable id. */
  watch?: { collection: 'orders' | 'appointments'; id: string };
  children: React.ReactNode;
}

/**
 * Loads exactly one business's public data before rendering a customer page.
 * Pages render their own "not found" state when the data is missing, so this
 * gate only blocks while loading.
 */
export const PublicBusinessGate: React.FC<PublicBusinessGateProps> = ({ slugOrId, watch, children }) => {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDone(false);
    setBusinessId(null);
    businessService
      .loadPublicBusiness(slugOrId)
      .then((biz) => {
        if (cancelled) return;
        if (biz && watch) bizStore.pinDoc(biz.id, watch.collection, watch.id);
        setBusinessId(biz?.id || null);
        setDone(true);
      })
      .catch((err) => {
        console.error('Could not load business', err);
        if (!cancelled) setDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slugOrId, watch?.collection, watch?.id]);

  useEffect(() => bizStore.subscribe(() => setVersion((v) => v + 1)), []);

  const loading = !done || (businessId !== null && !bizStore.isReady(businessId));
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#3027F5] dark:text-[#E4C174]" aria-label="Loading" />
      </div>
    );
  }
  return <>{children}</>;
};
