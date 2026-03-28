/**
 * Zero-Config Web APIs
 * Free APIs that require NO API keys or authentication
 */

import axios from 'axios';

/**
 * Wikipedia Search API
 * Free, no authentication required
 */
export interface WikipediaResult {
  title: string;
  summary: string;
  url: string;
  thumbnail?: string;
}

export async function searchWikipedia(query: string, limit: number = 5): Promise<WikipediaResult[]> {
  try {
    const { data } = await axios.get(
      'https://en.wikipedia.org/w/api.php',
      {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          srlimit: limit,
          format: 'json',
          origin: '*'
        },
        timeout: 10000,
      }
    );

    return data.query.search.map((item: any) => ({
      title: item.title,
      summary: item.snippet.replace(/<[^>]*>/g, ''),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
      thumbnail: undefined, // Would need separate request
    }));
  } catch (error: any) {
    throw new Error(`Wikipedia search failed: ${error.message}`);
  }
}

/**
 * Get Wikipedia page summary
 */
export async function getWikipediaSummary(title: string): Promise<string> {
  try {
    const { data } = await axios.get(
      'https://en.wikipedia.org/w/api.php',
      {
        params: {
          action: 'query',
          prop: 'extracts',
          exintro: true,
          explaintext: true,
          titles: title,
          format: 'json',
          origin: '*'
        },
        timeout: 10000,
      }
    );

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    return pages[pageId].extract || 'No summary available';
  } catch (error: any) {
    throw new Error(`Wikipedia summary failed: ${error.message}`);
  }
}

/**
 * Reddit JSON API (no authentication needed for public subreddits)
 */
export interface RedditPost {
  title: string;
  author: string;
  url: string;
  score: number;
  numComments: number;
  subreddit: string;
  created: string;
}

export async function getRedditPosts(
  subreddit: string,
  limit: number = 10,
  sort: 'hot' | 'new' | 'top' = 'hot'
): Promise<RedditPost[]> {
  try {
    const { data } = await axios.get(
      `https://www.reddit.com/r/${subreddit}/${sort}.json`,
      {
        params: { limit },
        headers: {
          'User-Agent': 'EchoCLI/1.0 (Educational Bot)',
        },
        timeout: 10000,
      }
    );

    return data.data.children.map((child: any) => ({
      title: child.data.title,
      author: child.data.author || '[deleted]',
      url: `https://reddit.com${child.data.permalink}`,
      score: child.data.score,
      numComments: child.data.num_comments,
      subreddit: child.data.subreddit,
      created: new Date(child.data.created_utc * 1000).toISOString(),
    }));
  } catch (error: any) {
    throw new Error(`Reddit fetch failed: ${error.message}`);
  }
}

/**
 * Search Reddit posts
 */
export async function searchReddit(
  subreddit: string,
  query: string,
  limit: number = 10
): Promise<RedditPost[]> {
  try {
    const { data } = await axios.get(
      `https://www.reddit.com/r/${subreddit}/search.json`,
      {
        params: { q: query, limit, restrict_sr: true },
        headers: {
          'User-Agent': 'EchoCLI/1.0 (Educational Bot)',
        },
        timeout: 10000,
      }
    );

    return data.data.children.map((child: any) => ({
      title: child.data.title,
      author: child.data.author || '[deleted]',
      url: `https://reddit.com${child.data.permalink}`,
      score: child.data.score,
      numComments: child.data.num_comments,
      subreddit: child.data.subreddit,
      created: new Date(child.data.created_utc * 1000).toISOString(),
    }));
  } catch (error: any) {
    throw new Error(`Reddit search failed: ${error.message}`);
  }
}

/**
 * Hacker News API (Firebase)
 * Free, no authentication required
 */
export interface HackerNewsItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: string;
  descendants: number;
  type: 'story' | 'comment' | 'job' | 'poll';
}

export async function getHackerNewsTop(limit: number = 10): Promise<HackerNewsItem[]> {
  try {
    // Get top story IDs
    const { data: ids } = await axios.get(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { timeout: 10000 }
    );

    // Fetch details for top N stories
    const stories = await Promise.all(
      ids.slice(0, limit).map(async (id: number) => {
        try {
          const { data } = await axios.get(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
            { timeout: 5000 }
          );
          return data;
        } catch {
          return null;
        }
      })
    );

    return stories
      .filter((item: any) => item && item.type === 'story')
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        score: item.score,
        by: item.by,
        time: new Date(item.time * 1000).toISOString(),
        descendants: item.descendants || 0,
        type: item.type,
      }));
  } catch (error: any) {
    throw new Error(`Hacker News fetch failed: ${error.message}`);
  }
}

/**
 * Hacker News new stories
 */
export async function getHackerNewsNew(limit: number = 10): Promise<HackerNewsItem[]> {
  try {
    const { data: ids } = await axios.get(
      'https://hacker-news.firebaseio.com/v0/newstories.json',
      { timeout: 10000 }
    );

    const stories = await Promise.all(
      ids.slice(0, limit).map(async (id: number) => {
        try {
          const { data } = await axios.get(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
            { timeout: 5000 }
          );
          return data;
        } catch {
          return null;
        }
      })
    );

    return stories
      .filter((item: any) => item && item.type === 'story')
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        score: item.score,
        by: item.by,
        time: new Date(item.time * 1000).toISOString(),
        descendants: item.descendants || 0,
        type: item.type,
      }));
  } catch (error: any) {
    throw new Error(`Hacker News new fetch failed: ${error.message}`);
  }
}

/**
 * Wayback Machine (Archive.org) API
 * Get archived versions of web pages
 */
export interface ArchiveResult {
  archived: boolean;
  url?: string;
  timestamp?: string;
  available?: boolean;
}

export async function getWebArchive(url: string): Promise<ArchiveResult> {
  try {
    // Check if URL is archived
    const { data } = await axios.get(
      `https://archive.org/wayback/available`,
      {
        params: { url },
        timeout: 10000,
      }
    );

    if (data.archived && data.closest) {
      return {
        archived: true,
        url: data.closest.url,
        timestamp: data.closest.timestamp,
        available: true,
      };
    }

    return { archived: false };
  } catch (error: any) {
    throw new Error(`Archive.org check failed: ${error.message}`);
  }
}

/**
 * Get archived snapshot from specific date
 */
export async function getArchiveSnapshot(
  url: string,
  date: string // YYYYMMDD format
): Promise<string | null> {
  try {
    const archiveUrl = `https://web.archive.org/web/${date}id_/${url}`;
    const { status } = await axios.head(archiveUrl, { timeout: 10000 });
    
    if (status === 200) {
      return archiveUrl;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Open-Meteo Weather API
 * Free weather API, no key required
 */
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  location: string;
}

export async function getWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    const { data } = await axios.get(
      'https://api.open-meteo.com/v1/forecast',
      {
        params: {
          latitude,
          longitude,
          current_weather: true,
          hourly: 'relativehumidity_2m',
        },
        timeout: 10000,
      }
    );

    const current = data.current_weather;
    const hourly = data.hourly;
    
    // Get current hour's humidity
    const currentHour = new Date().getHours();
    const humidity = hourly?.relativehumidity_2m?.[currentHour] || 0;

    // Simple condition mapping
    const conditionMap: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      95: 'Thunderstorm',
    };

    return {
      temperature: current.temperature,
      feelsLike: current.temperature, // Simplified
      humidity,
      windSpeed: current.windspeed,
      condition: conditionMap[current.weathercode] || 'Unknown',
      location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    };
  } catch (error: any) {
    throw new Error(`Weather fetch failed: ${error.message}`);
  }
}

/**
 * Get weather by city name (uses geocoding)
 */
export async function getWeatherByCity(cityName: string): Promise<WeatherData> {
  try {
    // First geocode the city name
    const { data: geoData } = await axios.get(
      'https://geocoding-api.open-meteo.com/v1/search',
      {
        params: { name: cityName, count: 1 },
        timeout: 10000,
      }
    );

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`City not found: ${cityName}`);
    }

    const { latitude, longitude, name } = geoData.results[0];
    const weather = await getWeather(latitude, longitude);
    
    return {
      ...weather,
      location: name,
    };
  } catch (error: any) {
    throw new Error(`Weather by city failed: ${error.message}`);
  }
}

/**
 * Export all zero-config tools
 */
export const zeroConfigAPIs = {
  // Wikipedia
  searchWikipedia,
  getWikipediaSummary,
  
  // Reddit
  getRedditPosts,
  searchReddit,
  
  // Hacker News
  getHackerNewsTop,
  getHackerNewsNew,
  
  // Archive.org
  getWebArchive,
  getArchiveSnapshot,
  
  // Weather
  getWeather,
  getWeatherByCity,
};
