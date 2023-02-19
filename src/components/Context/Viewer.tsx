import React, {
  createContext,
  ReactElement,
  useContext,
  useState,
} from "react";

import { Viewer as ViewerEntity } from "@/types/github";

const ViewerContext = createContext<ViewerEntity | undefined>(undefined);
const SetViewerContext = createContext<null | React.Dispatch<
  React.SetStateAction<ViewerEntity | undefined>
>>(null);

export const ViewerProvider = ({
  children,
}: {
  children: ReactElement;
}): ReactElement => {
  const [config, setConfig] = useState<ViewerEntity>();

  return (
    <SetViewerContext.Provider value={setConfig}>
      <ViewerContext.Provider value={config}>{children}</ViewerContext.Provider>
    </SetViewerContext.Provider>
  );
};

export const useViewer = (): [
  viewer: ViewerEntity | undefined,
  setViewer: React.Dispatch<React.SetStateAction<ViewerEntity | undefined>>
] => {
  const viewer = useContext(ViewerContext);
  const setViewer = useContext(SetViewerContext);
  if (setViewer === null) throw new Error(); // this will make setViewer non-null
  return [viewer, setViewer];
};
