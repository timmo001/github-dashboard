export interface Picker {
  id: string;
  label: string;
}

export enum Status {
  NotAuthorized = "Not Authorized",
  Authenticating = "Authenticating",
  Authenticated = "Authenticated",
  NotAuthenticated = "Not Authenticated",
  NoRepository = "No Repository",
}

export interface OAuth2 {
  access_token: string;
  error?: string;
  expires_at: number;
  expires_in: number;
  refresh_token_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export enum CurrentRepositoryType {
  Organization = "Organization",
  User = "User",
}

export interface CurrentRepository {
  type: CurrentRepositoryType;
  owner: string;
  repository: string;
}
