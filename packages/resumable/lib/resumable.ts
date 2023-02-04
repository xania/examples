export interface Resumable {
  hibernate(res: ResponseWriter): string;
}

interface ResponseWriter {
  write(str: string): void;
}

export function isResumable(obj: any): obj is Resumable {
  return obj && obj.hibernate instanceof Function;
}
