export interface RouteResolver {
  resolvePath(path: string): Promise<string | null>;
}
