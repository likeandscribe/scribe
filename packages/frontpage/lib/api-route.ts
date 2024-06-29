import "server-only";

export type Context = {
  headers: Headers;
};

export type ApiRouteHandler<JsonBody> = (
  request: Request,
  ctx: Context,
) => JsonBody | Promise<JsonBody>;

export type ApiRouteResponse<Handler extends ApiRouteHandler<unknown>> =
  Handler extends ApiRouteHandler<infer JsonBody> ? JsonBody : never;

class ResponseError {
  constructor(public response: Response) {}
}

export function badRequest(message: string, init?: RequestInit): never {
  throw new ResponseError(new Response(message, { ...init, status: 400 }));
}

export function createApiRoute<JsonBody>(
  handler: (request: Request, ctx: Context) => JsonBody | Promise<JsonBody>,
): ApiRouteHandler<JsonBody> {
  return async function (request: Request) {
    const headers = new Headers();
    let body;
    try {
      body = await handler(request, { headers });
    } catch (error) {
      if (error instanceof ResponseError) {
        return error.response;
      }
      throw error;
    }

    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify(body), {
      headers,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}
