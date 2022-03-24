import React, {
  createContext,
  ReactElement,
  useContext,
  useState,
} from "react";

import { User as UserEntity } from "lib/types/github";

const UserContext = createContext<UserEntity | undefined>(
  undefined
);
const SetUserContext = createContext<null | React.Dispatch<
  React.SetStateAction<UserEntity | undefined>
>>(null);

export const UserProvider = ({
  children,
}: {
  children: ReactElement;
}): ReactElement => {
  const [config, setConfig] = useState<UserEntity>();

  return (
    <SetUserContext.Provider value={setConfig}>
      <UserContext.Provider value={config}>
        {children}
      </UserContext.Provider>
    </SetUserContext.Provider>
  );
};

export const useUser = (): [
  user: UserEntity | undefined,
  setUser: React.Dispatch<
    React.SetStateAction<UserEntity | undefined>
  >
] => {
  const user = useContext(UserContext);
  const setUser = useContext(SetUserContext);
  if (setUser === null) throw new Error(); // this will make setUser non-null
  return [user, setUser];
};
