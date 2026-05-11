import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

export type UserEstado =
  | 'pendiente_aprobacion'
  | 'aprobado'
  | 'rechazado'
  | 'bloqueado'
  | 'multado'
  | 'proceso_judicial';

export type UserCategoria = 'comun' | 'especial' | 'plata' | 'oro' | 'platino';

export type User = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  domicilio: string;
  numeroPais: number;
  categoria: UserCategoria;
  estado: UserEstado;
  registroCompletado: boolean;
  fotoPerfilUrl: string | null;
  penalties: Array<{ id: string; monto: number; fechaLimite: string }>;
};

type AuthStore = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  pendingUserId: string | null;
  pendingEmail: string | null;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingRegistration: (userId: string, email: string) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  pendingUserId: null,
  pendingEmail: null,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setPendingRegistration: (pendingUserId, pendingEmail) => set({ pendingUserId, pendingEmail }),
  reset: () => set({ session: null, user: null, isLoading: false, pendingUserId: null, pendingEmail: null }),
}));
