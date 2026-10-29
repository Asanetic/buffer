// src/app/mosy_utils/hiveRoutes.js

export const hiveRoutes = {
  hiveBaseRoute: '/bf',
  main: '/bf/buffer',      // dairy sacco graders portal   relative to your Next.js routes
  buffer: '/bf/buffer', // CRM: clients/deals/revenueplan/messages/callhistory/payments/smartpaymentrequests
  auth: '/bf/auth',
  home: '/buffer/dashboard/main',
  // add more as needed
};

// <Link> / router.push add the Next basePath themselves, so strip it from hiveRoutes values
// (which include it for window.location / fetch) before handing them to those.
export const linkPath = (p = '') => p.startsWith(hiveRoutes.hiveBaseRoute) ? p.slice(hiveRoutes.hiveBaseRoute.length) || '/' : p;
