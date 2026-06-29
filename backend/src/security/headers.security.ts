import helmet from 'helmet';

export const secureHeaders = helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'none'"],
      'object-src': ["'none'"],
      'upgrade-insecure-requests': [],
    },
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: {
    maxAge: 15552000,
    includeSubDomains: true,
    preload: false,
  },
});
