import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	// No build-time prerendering: every route is data-driven (Postgres via
	// Hyperdrive) and is rendered on-demand by the Worker at request time.
} satisfies Config;
