/**
 * 410 Gone for the old `test-post-blah` permalink.
 *
 * Spec §3 sentences this URL to 410 rather than 301: a redirect transfers ranking value,
 * and pointing junk at the homepage dilutes relevance signals. A 410 tells a crawler to
 * drop the URL outright.
 *
 * This is a Pages Function rather than a line in `_redirects` because `_redirects`
 * supports only 301/302/303/307/308 — 410 is not available there (verified against
 * Cloudflare's documentation 2026-08-13). Redirect rules are not applied to paths served
 * by a Function, so there is no ordering conflict with the rest of the map.
 *
 * The post itself was read before being killed: its title is "LiTex Attending Wearable
 * Expo" and its body is genuine content, but it pre-announces the very expo that
 * /news/wearable-expo/ (2017-02-23) thanks visitors for, so nothing of substance is lost.
 * Do not "recover" it as an eighth news post.
 */
export const onRequest: () => Response = () =>
  new Response('410 Gone — this page has been permanently removed.', {
    status: 410,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
