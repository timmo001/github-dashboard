import axios from "axios";
import crypto from "crypto";

import { GraphQLResponse } from "./types/github";
import { OAuth2 } from "./types/general";

export class GitHub {
  auth: OAuth2;

  async authenticate(
    baseUrl: string,
    code: string,
    redirectUri: string,
    state: string
  ): Promise<OAuth2> {
    const response = await axios.post<any>(`${baseUrl}/auth/authenticate`, {
      code,
      redirectUri,
      state,
    });
    return response.data;
  }

  async refreshToken(baseUrl: string, refreshToken: string): Promise<OAuth2> {
    const response = await axios.post<any>(`${baseUrl}/auth/refresh`, {
      refreshToken,
    });
    return response.data;
  }

  getAuthorizeUrl(clientId: string, redirectUri: string): string {
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${crypto
      .randomBytes(16)
      .toString("hex")}`;
  }

  async graphQL<T = any>(
    query: string,
    variables?: NodeJS.Dict<any>
  ): Promise<T> {
    if (!this.auth) throw new Error("Not Authenticated");
    const response = await axios.post<GraphQLResponse<T>>(
      "https://api.github.com/graphql",
      {
        query,
        variables,
      },
      {
        headers: {
          Authorization: `${this.auth.token_type} ${this.auth.access_token}`,
        },
      }
    );
    if (!response.data.data && response.data.errors) {
      console.error(response.data);
      throw new Error(
        `Errors when getting GraphQL Data: ${JSON.stringify(
          response.data.errors
        )}`
      );
    }
    return response.data.data;
  }

  setAuth(oauthData: OAuth2): void {
    this.auth = oauthData;
  }
}
