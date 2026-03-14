import { Octokit } from 'octokit';
import { getConfig } from '../utils/config.js';
import chalk from 'chalk';

/**
 * GitHub Toolset - Allows Echo to collaborate on GitHub
 */

async function getOctokit() {
  const config = getConfig().getGithubConfig();
  if (!config || !config.token || !config.enabled) {
    throw new Error('GitHub is not configured. Run "echo auth github" first.');
  }
  return new Octokit({ auth: config.token });
}

/**
 * Create a Pull Request
 */
export async function githubCreatePullRequest(owner: string, repo: string, title: string, head: string, base: string = 'main', body?: string) {
  try {
    const octokit = await getOctokit();
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });
    return { success: true, url: pr.html_url, number: pr.number };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create an Issue
 */
export async function githubCreateIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]) {
  try {
    const octokit = await getOctokit();
    const { data: issue } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    return { success: true, url: issue.html_url, number: issue.number };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Search repositories
 */
export async function githubSearchRepos(query: string) {
  try {
    const octokit = await getOctokit();
    const { data: results } = await octokit.rest.search.repos({
      q: query,
    });
    return results.items.map(repo => ({
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
    }));
  } catch (error: any) {
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Get current authenticated user
 */
export async function githubGetUser() {
  try {
    const octokit = await getOctokit();
    const { data: user } = await octokit.rest.users.getAuthenticated();
    return {
      login: user.login,
      name: user.name,
      bio: user.bio,
      public_repos: user.public_repos,
    };
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export const githubTools = {
  githubCreatePullRequest,
  githubCreateIssue,
  githubSearchRepos,
  githubGetUser,
};
