import React, {
  createContext,
  ReactElement,
  useContext,
  useState,
} from "react";

import { OAuth2 as AuthEntity } from "@/types/general";

const AuthContext = createContext<AuthEntity | undefined>(undefined);
const SetAuthContext = createContext<null | React.Dispatch<
  React.SetStateAction<AuthEntity | undefined>
>>(null);

export const AuthProvider = ({
  children,
}: {
  children: ReactElement;
}): ReactElement => {
  const [config, setConfig] = useState<AuthEntity>();

  return (
    <SetAuthContext.Provider value={setConfig}>
      <AuthContext.Provider value={config}>{children}</AuthContext.Provider>
    </SetAuthContext.Provider>
  );
};

export const useAuth = (): [
  auth: AuthEntity | undefined,
  setAuth: React.Dispatch<React.SetStateAction<AuthEntity | undefined>>
] => {
  const auth = useContext(AuthContext);
  const setAuth = useContext(SetAuthContext);
  if (setAuth === null) throw new Error(); // this will make setAuth non-null
  return [auth, setAuth];
};
