export interface Resumable {
  hibernate(res: ResponseWriter): string;
}

interface ResponseWriter {
  write(value: any): void;
  hydrate(obj: any): void;
  hibernate(obj: any): void;
  resumableUrl(source: string): string;
}

export function isResumable(obj: any): obj is Resumable {
  return obj && obj.hibernate instanceof Function;
}
