import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";

/**
 * SSR entry for the Cloudflare Workers runtime.
 *
 * React Router's default server entry uses Node's renderToPipeableStream, which
 * doesn't exist on Workers ("renderToPipeableStream is not a function"). This
 * custom entry uses the Web Streams renderToReadableStream instead, which the
 * Workers runtime supports.
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
) {
  let statusCode = responseStatusCode;

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        statusCode = 500;
        console.error(error);
      },
    },
  );

  // For crawlers/bots, wait for the full document so they get complete HTML.
  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    status: statusCode,
    headers: responseHeaders,
  });
}
