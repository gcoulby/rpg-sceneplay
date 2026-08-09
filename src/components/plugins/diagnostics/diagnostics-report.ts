/**
 * sysInfo()
 * Captures OS, browser (with patch version), and environment details
 * for use in diagnostics / bug reports.
 *
 * Returns a plain object. Use JSON.stringify(sysInfo(), null, 2) to
 * print it or send it in a support ticket.
 */
export async function generateDiagnosticsReport() {
  const ua = navigator.userAgent

  // --- Browser detection ---------------------------------------------
  // Order matters: some UAs contain multiple tokens (e.g. Chrome-based
  // browsers all include "Chrome/x.x" even if they're really Edge, Opera,
  // Brave, etc). Check the more specific tokens first.
  const browserPatterns = [
    { name: 'Edge', regex: /Edg\/([\d.]+)/ },
    { name: 'Opera', regex: /OPR\/([\d.]+)/ },
    { name: 'Samsung Internet', regex: /SamsungBrowser\/([\d.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
    { name: 'Chrome', regex: /Chrome\/([\d.]+)/ },
    { name: 'Safari', regex: /Version\/([\d.]+).*Safari/ },
    { name: 'Internet Explorer', regex: /(?:MSIE |rv:)([\d.]+)/ },
  ]

  let browserName = 'Unknown'
  let browserVersion = 'Unknown'

  for (const { name, regex } of browserPatterns) {
    const match = ua.match(regex)
    if (match) {
      browserName = name
      browserVersion = match[1]
      break
    }
  }

  // --- OS detection -----------------------------------------------------
  const osPatterns = [
    { name: 'Windows 11/10', regex: /Windows NT 10\.0/ },
    { name: 'Windows 8.1', regex: /Windows NT 6\.3/ },
    { name: 'Windows 8', regex: /Windows NT 6\.2/ },
    { name: 'Windows 7', regex: /Windows NT 6\.1/ },
    { name: 'macOS', regex: /Mac OS X ([\d_]+)/ },
    { name: 'iOS', regex: /OS ([\d_]+) like Mac OS X/ },
    { name: 'Android', regex: /Android ([\d.]+)/ },
    { name: 'Linux', regex: /Linux/ },
    { name: 'Chrome OS', regex: /CrOS/ },
  ]

  let osName = 'Unknown'
  let osVersion = ''

  for (const { name, regex } of osPatterns) {
    const match = ua.match(regex)
    if (match) {
      osName = name
      if (match[1]) osVersion = match[1].replace(/_/g, '.')
      break
    }
  }

  // --- Modern override: User-Agent Client Hints API --------------------
  // Chromium browsers expose a more reliable, structured API for this.
  // Freezes exact full version numbers (including patch) when available.
  let uaChData = null
  if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    try {
      uaChData = await navigator.userAgentData.getHighEntropyValues([
        'platform',
        'platformVersion',
        'fullVersionList',
        'model',
        'architecture',
        'bitness',
      ])

      if (uaChData.fullVersionList && uaChData.fullVersionList.length) {
        // Pick the entry that isn't a "not-a-brand" placeholder
        const realBrand = uaChData.fullVersionList.find(
          (b) => !/Not.*A.*Brand/i.test(b.brand),
        )
        if (realBrand) {
          browserName = realBrand.brand
          browserVersion = realBrand.version // includes patch, e.g. 126.0.6478.126
        }
      }

      if (uaChData.platform) {
        osName = uaChData.platform
        osVersion = uaChData.platformVersion || osVersion
      }
    } catch (e) {
      console.error(e)
      // getHighEntropyValues can throw/reject if blocked by permissions
      // policy — silently fall back to the regex-based values above.
    }
  }

  // --- Everything else useful for a bug report --------------------------
  const report = {
    timestamp: new Date().toISOString(),
    browser: {
      name: browserName,
      version: browserVersion,
    },
    os: {
      name: osName,
      version: osVersion,
    },
    device: {
      mobile: /Mobi|Android/i.test(ua),
      model: uaChData?.model || null,
      architecture: uaChData?.architecture || null,
      bitness: uaChData?.bitness || null,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio,
      colorDepth: window.screen.colorDepth,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    locale: {
      language: navigator.language,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    hardware: {
      cpuCores: navigator.hardwareConcurrency || null,
      deviceMemoryGB: navigator.deviceMemory || null,
    },
    connection: navigator.connection
      ? {
          effectiveType: navigator.connection.effectiveType,
          downlinkMbps: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
        }
      : null,
    flags: {
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      doNotTrack: navigator.doNotTrack || null,
    },
    url: window.location.href,
    rawUserAgent: ua,
  }

  return report
}

// Example usage:
// sysInfo().then(report => {
//   console.log(JSON.stringify(report, null, 2));
//   // or POST it to your support endpoint
// });
