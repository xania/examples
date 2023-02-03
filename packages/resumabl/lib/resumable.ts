export interface Resumable {
  hibernate(write: (s: string) => void): string;
}

export function isResumable(obj: any): obj is Resumable {
  return obj && obj.hibernate instanceof Function;
}
