// "Build my Base" state: chosen add-ons and how the member wants their containers.
// Kept in memory, with a best-effort copy in localStorage so a reload doesn't lose it.
// Nothing here is an order: Base has no checkout yet.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ContainerMode } from '../data/api.ts';

interface BuildState {
  addOnIds: number[];
  containerMode: ContainerMode;
  open: boolean;
  reserved: boolean;
  toggleAddOn: (id: number) => void;
  setContainerMode: (m: ContainerMode) => void;
  openBuilder: () => void;
  closeBuilder: () => void;
  reserve: () => void;
  reset: () => void;
}

const Ctx = createContext<BuildState | null>(null);
const KEY = 'base.build.v1';

export function BuildProvider({ children }: { children: ReactNode }) {
  const [addOnIds, setAddOns] = useState<number[]>([]);
  const [containerMode, setContainerMode] = useState<ContainerMode>('borrow');
  const [open, setOpen] = useState(false);
  const [reserved, setReserved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (saved && Array.isArray(saved.addOnIds)) setAddOns(saved.addOnIds.filter((x: unknown) => typeof x === 'number'));
      if (saved && ['borrow', 'own', 'returning'].includes(saved.containerMode)) setContainerMode(saved.containerMode);
    } catch { /* storage unavailable: keep defaults */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ addOnIds, containerMode })); } catch { /* ignore */ }
  }, [addOnIds, containerMode]);

  const toggleAddOn = useCallback((id: number) => {
    setReserved(false);
    setAddOns((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }, []);
  const value = useMemo<BuildState>(() => ({
    addOnIds, containerMode, open, reserved, toggleAddOn,
    setContainerMode: (m) => { setReserved(false); setContainerMode(m); },
    openBuilder: () => setOpen(true),
    closeBuilder: () => setOpen(false),
    reserve: () => setReserved(true),
    reset: () => { setAddOns([]); setContainerMode('borrow'); setReserved(false); },
  }), [addOnIds, containerMode, open, reserved, toggleAddOn]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBuild(): BuildState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBuild outside BuildProvider');
  return v;
}
