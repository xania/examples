export interface RouteResolver {
  resolvePage(path: string): Promise<string | null>;
}
