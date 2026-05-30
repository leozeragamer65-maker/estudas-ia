import { createContext, useContext } from "react";

export interface AppCtx {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

export const AppCtxContext = createContext<AppCtx | null>(null);

export const useAppCtx = () => {
  const v = useContext(AppCtxContext);
  if (!v) throw new Error("useAppCtx fora do provider");
  return v;
};
