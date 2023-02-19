import React, { ReactElement } from "react";
import Head from "next/head";
import { ClassNameMap } from "@mui/styles";

import Header from "./Header";
import HeaderLinks from "./HeaderLinks";

interface LayoutProps {
  children?: ReactElement | ReactElement[];
  classes: ClassNameMap;
  description?: string;
  keywords?: string;
  title?: string;
  url?: string;
}

function Layout(props: LayoutProps): ReactElement {
  return (
    <>
      <Head>
        <title>
          {props.title
            ? `${props.title} - GitHub Dashboard`
            : `GitHub Dashboard`}
        </title>
        <link rel="canonical" href={props.url} />
        <meta
          name="description"
          content={
            props.description
              ? `${props.description}`
              : props.title
              ? `${props.title} - GitHub Dashboard`
              : `GitHub Dashboard`
          }
        />
        <meta
          name="keywords"
          content={
            props.keywords
              ? `${props.keywords}`
              : `material, azure, devops, azure-devops, material-ui, nextjs, reactjs, react, developer`
          }
        />
      </Head>
      <Header
        {...props}
        brand="GitHub Dashboard"
        changeColorOnScroll={{
          height: 54,
          color: "primary",
        }}
        color="transparent"
        fixed
        rightLinks={<HeaderLinks />}
      />
      {props.children}
    </>
  );
}

export default Layout;
