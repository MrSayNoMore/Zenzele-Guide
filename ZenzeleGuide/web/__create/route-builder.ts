import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

type RouteModule = Record<
  string,
  (req: Request, ctx: { params: Record<string, string> }) => Response | Promise<Response>
>;

// Statically import every API route module at build time. This replaces the
// original implementation, which scanned the filesystem (readdir) and imported
// route files by absolute path at runtime — neither of which works once the app
// is bundled and run on Cloudflare Workers (no filesystem, no arbitrary dynamic
// import). import.meta.glob inlines all route.js modules into the bundle so the
// API works on workerd.
const routeModules = import.meta.glob('../src/app/api/**/route.js', {
  eager: true,
}) as Record<string, RouteModule>;

// Convert a glob key like '../src/app/api/jobs/[id]/route.js' into Hono path
// segments. Dynamic segments [id] -> :id and catch-alls [...rest] -> :rest{.+}.
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  const relativePath = routeFile.replace(/^.*\/api\//, '').replace(/\/?route\.js$/, '');
  const parts = relativePath.split('/').filter(Boolean);
  if (parts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  return parts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
}

function registerRoutes() {
  // Register longer (more specific) paths first so they win over catch-alls.
  const entries = Object.entries(routeModules).sort((a, b) => b[0].length - a[0].length);

  api.routes = [];

  for (const [routeFile, route] of entries) {
    const parts = getHonoPath(routeFile);
    const honoPath = `/${parts.map(({ pattern }) => pattern).join('/')}`;
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

    for (const method of methods) {
      const fn = route[method];
      if (typeof fn !== 'function') continue;

      const handler: Handler = async (c) => {
        const params = c.req.param();
        return await fn(c.req.raw, { params });
      };

      switch (method) {
        case 'GET':
          api.get(honoPath, handler);
          break;
        case 'POST':
          api.post(honoPath, handler);
          break;
        case 'PUT':
          api.put(honoPath, handler);
          break;
        case 'DELETE':
          api.delete(honoPath, handler);
          break;
        case 'PATCH':
          api.patch(honoPath, handler);
          break;
      }
    }
  }
}

registerRoutes();

export { api, API_BASENAME };
