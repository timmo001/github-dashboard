import React, {
  createContext,
  ReactElement,
  useContext,
  useState,
} from "react";

import { Repository as RepositoryEntity } from "@/types/github";

const RepositoryContext = createContext<RepositoryEntity | undefined>(
  undefined
);
const SetRepositoryContext = createContext<null | React.Dispatch<
  React.SetStateAction<RepositoryEntity | undefined>
>>(null);

export const RepositoryProvider = ({
  children,
}: {
  children: ReactElement;
}): ReactElement => {
  const [config, setConfig] = useState<RepositoryEntity>();

  return (
    <SetRepositoryContext.Provider value={setConfig}>
      <RepositoryContext.Provider value={config}>
        {children}
      </RepositoryContext.Provider>
    </SetRepositoryContext.Provider>
  );
};

export const useRepository = (): [
  repository: RepositoryEntity | undefined,
  setRepository: React.Dispatch<
    React.SetStateAction<RepositoryEntity | undefined>
  >
] => {
  const repository = useContext(RepositoryContext);
  const setRepository = useContext(SetRepositoryContext);
  if (setRepository === null) throw new Error(); // this will make setRepository non-null
  return [repository, setRepository];
};
