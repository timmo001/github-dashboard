export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<NodeJS.Dict<any>>;
}

export interface RateLimit {
  cost: number;
  remaining: number;
}

export interface BaseData {
  rateLimit: RateLimit;
}

// Viewer
export interface ViewerData extends BaseData {
  viewer: Viewer;
}

export interface Viewer {
  avatarUrl: string;
  login: string;
  name?: string;
  followers?: Followers;
  url: string;
  repositories?: Repositories;
}

// Organization
export interface OrganizationData extends BaseData {
  organization: Organization;
}

export interface Organization {
  avatarUrl: string;
  login: string;
  name: string;
  url: string;
  repositories: Repositories;
}

// User
export interface UserData extends BaseData {
  user: User;
}

export interface User {
  avatarUrl: string;
  login: string;
  name: string;
  url: string;
  followers: Followers;
  repositories: Repositories;
}

// Viewer / User
export interface Followers {
  totalCount: number;
}

// Viewer / User / Organization
export interface Repositories {
  totalCount: number;
  nodes: Array<RepositoryNode>;
}

export interface RepositoryNode {
  name: string;
  owner: Owner;
}

export interface Owner {
  login: string;
}

// Repository
export interface RepositoryData extends BaseData {
  repository: Repository;
}

export interface Repository {
  name: string;
  createdAt: Date;
  pushedAt: Date;
  updatedAt: Date;
  url: string;
  stargazers_count: number;
  forks_count: number;
  full_name: string;
  id: number;
  description: string;
  owner: User;
  default_branch_ref: DefaultBranchRef;
  discussions: Discussion;
  issues: Issue;
  issuesOpen: Count;
  pullRequests: PullRequest;
  pullRequestsOpen: Count;
  release: Release;
  refs: Refs;
  primaryLanguage: PrimaryLanguage;
  watchers: Watchers;
}

export interface Author {
  avatarUrl: string;
  login: string;
}

export interface DefaultBranchRef {
  commit: Commit;
}

export interface Commit {
  message: string;
  url: string;
  sha: string;
}

export interface Count {
  total: number;
}

export interface Discussion extends Count {
  discussions: Array<DiscussionElement>;
}

export interface DiscussionElement {
  title: string;
  url: string;
  number: number;
}

export interface IssueElement {
  title: string;
  url: string;
  number: number;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date;
  closed: boolean;
  author: Author;
}

export interface Issue extends Count {
  items: Array<IssueElement>;
}

export interface PrimaryLanguage {
  name: string;
  color: string;
  id: string;
}

export interface PullRequest extends Count {
  items: Array<IssueElement>;
}

export interface Refs {
  tags: Array<Tag>;
}

export interface Tag {
  name: string;
  target: Target;
}

export interface Target {
  url: string;
}

export interface Release {
  name: string;
  url: string;
  tag: string;
}

export interface Watchers {
  totalCount: number;
}
