/**
 * Web Search & Scraping Tools
 * Search and scrape information from the web
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  links: string[];
  timestamp: number;
}

/**
 * Search using DuckDuckGo (no API key required)
 */
export async function searchWeb(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    // Use DuckDuckGo HTML search and parse results
    const encodedQuery = encodeURIComponent(query);
    const { data } = await axios.get(
      `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EchoCLI/1.0)',
        },
        timeout: 10000,
      }
    );

    // Parse results from HTML
    const results: SearchResult[] = [];
    const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
    const snippetRegex = /<a class="result__snippet" href="[^"]*">([^<]+)<\/a>/g;
    
    let match;
    let index = 0;
    
    while ((match = resultRegex.exec(data)) !== null && index < limit) {
      const url = match[1];
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      
      // Try to get snippet
      const snippetMatch = snippetRegex.exec(data);
      const snippet = snippetMatch 
        ? snippetMatch[1].replace(/<[^>]*>/g, '').trim()
        : '';
      
      results.push({
        title,
        url: decodeURIComponent(url),
        snippet,
        source: 'DuckDuckGo',
      });
      
      index++;
    }

    return results;
  } catch (error: any) {
    throw new Error(`Web search failed: ${error.message}`);
  }
}

/**
 * Search using Google (requires API key or falls back to scraping)
 */
export async function searchGoogle(
  query: string,
  apiKey?: string,
  cx?: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (apiKey && cx) {
    // Use official API
    try {
      const { data } = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: { key: apiKey, cx, q: query, num: limit },
          timeout: 10000,
        }
      );

      return data.items.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'Google',
      }));
    } catch (error: any) {
      console.log('Google API failed, falling back to DuckDuckGo');
    }
  }

  // Fallback to DuckDuckGo
  return searchWeb(query, limit);
}

/**
 * Scrape content from a URL
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EchoCLI/1.0)',
      },
      timeout: 15000,
      responseType: 'text' as const,
    });

    // Extract title
    const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Remove scripts and styles
    let content = data
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length
    content = content.substring(0, 10000) + (content.length > 10000 ? '...' : '');

    // Extract links
    const links: string[] = [];
    const linkRegex = /<a[^>]+href="([^"]+)"/g;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(data)) !== null) {
      const href = linkMatch[1];
      if (href.startsWith('http') && !links.includes(href)) {
        links.push(href);
      }
    }

    return {
      url,
      title,
      content,
      links: links.slice(0, 50), // Limit links
      timestamp: Date.now(),
    };
  } catch (error: any) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

/**
 * Fetch and summarize RSS feed
 */
export async function fetchRSS(url: string): Promise<Array<{
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
}>> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EchoCLI/1.0)',
      },
      timeout: 10000,
    });

    const items: any[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(data)) !== null) {
      const itemContent = itemMatch[1];
      
      const titleMatch = itemContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      const linkMatch = itemContent.match(/<link[^>]*>([^<]+)<\/link>/i);
      const dateMatch = itemContent.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
      const descMatch = itemContent.match(/<description[^>]*>([^<]+)<\/description>/i);

      items.push({
        title: titleMatch?.[1]?.trim() || 'Untitled',
        link: linkMatch?.[1]?.trim() || '',
        pubDate: dateMatch?.[1]?.trim(),
        description: descMatch?.[1]?.replace(/<[^>]+>/g, '').trim(),
      });
    }

    return items;
  } catch (error: any) {
    throw new Error(`Failed to fetch RSS: ${error.message}`);
  }
}

/**
 * Get news headlines
 */
export async function getNews(query?: string, limit: number = 10): Promise<SearchResult[]> {
  const searchQuery = query 
    ? `${query} news site:reuters.com OR site:bbc.com OR site:cnn.com`
    : 'news site:reuters.com OR site:bbc.com OR site:cnn.com';
  
  return searchWeb(searchQuery, limit);
}

/**
 * Check if a website is reachable
 */
export async function checkWebsite(url: string): Promise<{
  reachable: boolean;
  status?: number;
  responseTime?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    const { status } = await axios.head(url, {
      timeout: 10000,
      validateStatus: () => true,
    });
    const responseTime = Date.now() - start;

    return {
      reachable: status >= 200 && status < 400,
      status,
      responseTime,
    };
  } catch (error: any) {
    return {
      reachable: false,
      error: error.message,
    };
  }
}

/**
 * Web tools export
 */
export const webTools = {
  searchWeb,
  searchGoogle,
  scrapeUrl,
  fetchRSS,
  getNews,
  checkWebsite,
};
