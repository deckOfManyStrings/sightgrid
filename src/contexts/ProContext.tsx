import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Firelane Pro is a Stripe-billed subscription.
 * After payment, the user's Supabase auth metadata is updated with { plan: 'pro' }.
 * We also cache the status in localStorage so we don't wait for an auth round-trip on
 * repeat visits, and we re-read it whenever the auth session changes.
 */

interface ProContextValue {
  isPro: boolean;
  loading: boolean;
  /** Force a re-check (e.g. after returning from Stripe) */
  refresh: () => void;
  /** Open the Pro upgrade modal */
  openProModal: () => void;
}

const ProContext = createContext<ProContextValue | null>(null);

const LS_KEY = 'firelane_pro_status';

import { ProModal } from '../components/ProModal';

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const checkPro = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
      const plan = (meta?.plan as string | undefined) ?? '';
      const proStatus = plan === 'pro';
      setIsPro(proStatus);
      try { localStorage.setItem(LS_KEY, String(proStatus)); } catch {}
    } catch {
      // network error — fall back to cached value
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPro();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPro();
    });
    return () => subscription.unsubscribe();
  }, [checkPro]);

  return (
    <ProContext.Provider value={{ isPro, loading, refresh: checkPro, openProModal: () => setModalOpen(true) }}>
      {children}
      {modalOpen && <ProModal onClose={() => setModalOpen(false)} />}
    </ProContext.Provider>
  );
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used within <ProProvider>');
  return ctx;
}
