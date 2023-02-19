import { ReactElement, useEffect } from "react";
import { AppProps } from "next/app";
import Head from "next/head";
import {
  CssBaseline,
  ThemeProvider,
  Theme,
  StyledEngineProvider,
} from "@mui/material";

import { AuthProvider } from "@/components/Context/Auth";
import { RepositoryProvider } from "@/components/Context/Repository";
import { UserProvider } from "@/components/Context/User";
import { ViewerProvider } from "@/components/Context/Viewer";
import theme from "@/components/Theme";

import "@fontsource/roboto";

import "@/styles/css/style.css";

declare module "@mui/styles/defaultTheme" {
  interface DefaultTheme extends Theme {}
}

export default function App({ Component, pageProps }: AppProps): ReactElement {
  useEffect(() => {
    document.documentElement.lang = "en-GB";
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />;

  return (
    <>
      <Head>
        <title>GitHub Dashboard</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <>
              <UserProvider>
                <>
                  <ViewerProvider>
                    <>
                      <RepositoryProvider>
                        <>
                          <CssBaseline />
                          <Component {...pageProps} />
                        </>
                      </RepositoryProvider>
                    </>
                  </ViewerProvider>
                </>
              </UserProvider>
            </>
          </AuthProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </>
  );
}
