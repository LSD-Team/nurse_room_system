export interface AuthorizeType {
  AuthorizeID: number;
  AuthorizeName: string;
}

export interface AuthorizeUser {
  AuthorizeID: AuthorizeType['AuthorizeID'];
  UserID: string;
  Create_by?: string;
  Create_at?: string;
}
