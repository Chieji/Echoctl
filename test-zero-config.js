#!/usr/bin/env node

/**
 * Test Zero-Config APIs
 */

import {
  searchWikipedia,
  getWikipediaSummary,
  getRedditPosts,
  searchReddit,
  getHackerNewsTop,
  getWebArchive,
  getWeatherByCity,
} from './src/tools/zero-config-apis.js';

console.log('🧪 Testing Zero-Config APIs\n');

// Test 1: Wikipedia
console.log('1. Testing Wikipedia Search...');
try {
  const results = await searchWikipedia('Artificial Intelligence', 3);
  console.log('✅ Wikipedia Search works!');
  console.log(`   Found ${results.length} results`);
  console.log(`   First: ${results[0].title}`);
} catch (error) {
  console.log('❌ Wikipedia Search failed:', error.message);
}
console.log('');

// Test 2: Wikipedia Summary
console.log('2. Testing Wikipedia Summary...');
try {
  const summary = await getWikipediaSummary('TypeScript');
  console.log('✅ Wikipedia Summary works!');
  console.log(`   Summary length: ${summary.length} chars`);
} catch (error) {
  console.log('❌ Wikipedia Summary failed:', error.message);
}
console.log('');

// Test 3: Reddit
console.log('3. Testing Reddit Posts...');
try {
  const posts = await getRedditPosts('technology', 3);
  console.log('✅ Reddit Posts works!');
  console.log(`   Found ${posts.length} posts`);
  if (posts.length > 0) {
    console.log(`   Top post: ${posts[0].title}`);
  }
} catch (error) {
  console.log('❌ Reddit Posts failed:', error.message);
}
console.log('');

// Test 4: Hacker News
console.log('4. Testing Hacker News...');
try {
  const news = await getHackerNewsTop(3);
  console.log('✅ Hacker News works!');
  console.log(`   Found ${news.length} stories`);
  if (news.length > 0) {
    console.log(`   Top story: ${news[0].title}`);
  }
} catch (error) {
  console.log('❌ Hacker News failed:', error.message);
}
console.log('');

// Test 5: Archive.org
console.log('5. Testing Archive.org...');
try {
  const archive = await getWebArchive('https://example.com');
  console.log('✅ Archive.org check works!');
  console.log(`   Archived: ${archive.archived}`);
  if (archive.url) {
    console.log(`   URL: ${archive.url}`);
  }
} catch (error) {
  console.log('❌ Archive.org failed:', error.message);
}
console.log('');

// Test 6: Weather
console.log('6. Testing Weather API...');
try {
  const weather = await getWeatherByCity('London');
  console.log('✅ Weather API works!');
  console.log(`   Temperature: ${weather.temperature}°C`);
  console.log(`   Condition: ${weather.condition}`);
} catch (error) {
  console.log('❌ Weather API failed:', error.message);
}
console.log('');

console.log('='.repeat(50));
console.log('✅ All zero-config API tests completed!\n');
