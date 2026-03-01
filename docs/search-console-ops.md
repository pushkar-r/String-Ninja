# Search Console and Ranking Operations

Use this runbook weekly after deployment.

## 1) Submit and verify sitemap
- Open Google Search Console property for `https://stringninja.in/`.
- Submit `https://stringninja.in/sitemap.xml`.
- Confirm discovered URLs increase after each content release.

## 2) Request indexing for priority pages
Priority set:
- `/tools`
- `/learn`
- Newly published `/tools/<slug>` pages
- Newly published `/learn/*` guides

## 3) Monitor Coverage
- Watch for `Duplicate, submitted URL not selected as canonical`.
- Watch for `Crawled - currently not indexed`.
- If present, improve content uniqueness and internal links for affected pages.

## 4) Monitor Performance
Track weekly:
- Queries
- Pages
- CTR
- Average Position

Prioritize pages with high impressions + low CTR for title/description improvements.

## 5) Monitor Core Web Vitals
- Check Mobile first.
- Resolve LCP and CLS issues on pages with highest impressions.

## 6) Monetization checks (AdSense)
- Confirm `ads.txt` is reachable.
- Re-check Policy Center after major content pushes.
- Request review only after crawl/index updates are visible.
