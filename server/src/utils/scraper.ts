import dns from 'dns/promises';

export interface ScrapedResult {
  url: string;
  title: string;
  text: string;
}

/**
 * Validates if an IP address belongs to private, loopback, or link-local address spaces.
 * Security by Design: Prevents Server-Side Request Forgery (SSRF) against internal services & cloud metadata.
 */
function isPrivateIp(ip: string): boolean {
  // IPv4 checks
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-local / AWS & GCP cloud instance metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  }

  // IPv6 checks
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    // Loopback
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // Unspecified
    if (lower === '::') return true;
    // Link-local
    if (lower.startsWith('fe80:')) return true;
    // Unique local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  }

  return false;
}

export async function scrapeUrl(urlString: string): Promise<ScrapedResult> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format. Please provide a full http:// or https:// URL.');
  }

  // 1. Protocol Restriction: Only HTTP and HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are permitted.');
  }

  // 2. Port Restriction: Only standard web ports
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error('Non-standard network ports are blocked for security.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Hostname Denylist
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan')
  ) {
    throw new Error('Access to local/internal network domains is prohibited.');
  }

  // 4. DNS Resolution & IP Range Check (SSRF Guard)
  try {
    const lookup = await dns.lookup(hostname);
    if (isPrivateIp(lookup.address)) {
      throw new Error('Access to private or link-local IP addresses is strictly blocked.');
    }
  } catch (dnsErr: any) {
    if (dnsErr.message.includes('blocked') || dnsErr.message.includes('prohibited')) {
      throw dnsErr;
    }
    throw new Error(`Failed to resolve host "${hostname}": domain does not exist or DNS lookup failed.`);
  }

  // 5. Fetch with short timeout (8 seconds) and realistic User-Agent
  const response = await fetch(parsed.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error('Target URL did not return HTML or plain text.');
  }

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';

  // Clean HTML
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  clean = decodeHtmlEntities(clean);
  clean = clean.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();

  // Limit length to avoid massive payloads
  if (clean.length > 15000) {
    clean = clean.slice(0, 15000) + '... [truncated]';
  }

  return {
    url: parsed.toString(),
    title,
    text: clean
  };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
