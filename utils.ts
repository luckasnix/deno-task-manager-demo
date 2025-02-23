export type JsonBody = Record<string, unknown> | Array<unknown>;

export class JsonResponse extends Response {
  constructor(body: JsonBody, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    const responseInit: ResponseInit = {
      ...init,
      headers,
    };
    super(JSON.stringify(body), responseInit);
  }
}
