/**
 * GitHub Plugin for Echoctl
 * Enables GitHub operations: repos, issues, PRs, workflows, etc.
 */

import { Plugin } from '../../src/services/PluginManager';

export const githubPlugin: Plugin = {
  name: 'github',
  version: '1.0.0',
  description: 'GitHub integration for Echoctl - manage repos, issues, PRs, and workflows',
  author: 'Manus AI',

  async initialize() {
    console.log('🔗 Initializing GitHub plugin...');
    // Validate GitHub token
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn('⚠️  GITHUB_TOKEN not set. GitHub operations will be limited.');
    }
  },

  async destroy() {
    console.log('🔗 Destroying GitHub plugin...');
  },

  tools: {
    /**
     * List repositories
     */
    listRepos: {
      name: 'github:listRepos',
      description: 'List GitHub repositories for a user or organization',
      args: {
        owner: { type: 'string', description: 'GitHub username or org' },
        type: { type: 'string', enum: ['all', 'owner', 'member'], default: 'owner' },
        sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], default: 'updated' },
        limit: { type: 'number', default: 30 },
      },
      async execute(args: any) {
        try {
          const { owner, type, sort, limit } = args;
          const token = process.env.GITHUB_TOKEN;

          const response = await fetch(`https://api.github.com/users/${owner}/repos?type=${type}&sort=${sort}&per_page=${limit}`, {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
          }

          const repos = await response.json();
          return {
            success: true,
            count: repos.length,
            repos: repos.map((r: any) => ({
              name: r.name,
              url: r.html_url,
              description: r.description,
              stars: r.stargazers_count,
              language: r.language,
              updated: r.updated_at,
            })),
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * Create a GitHub issue
     */
    createIssue: {
      name: 'github:createIssue',
      description: 'Create a new GitHub issue',
      args: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue description' },
        labels: { type: 'array', description: 'Issue labels' },
        assignees: { type: 'array', description: 'GitHub usernames to assign' },
      },
      async execute(args: any) {
        try {
          const { owner, repo, title, body, labels, assignees } = args;
          const token = process.env.GITHUB_TOKEN;

          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title,
              body,
              labels: labels || [],
              assignees: assignees || [],
            }),
          });

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
          }

          const issue = await response.json();
          return {
            success: true,
            issueNumber: issue.number,
            url: issue.html_url,
            createdAt: issue.created_at,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * List pull requests
     */
    listPullRequests: {
      name: 'github:listPullRequests',
      description: 'List pull requests for a repository',
      args: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
        limit: { type: 'number', default: 20 },
      },
      async execute(args: any) {
        try {
          const { owner, repo, state, limit } = args;
          const token = process.env.GITHUB_TOKEN;

          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=${limit}`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
          }

          const prs = await response.json();
          return {
            success: true,
            count: prs.length,
            pullRequests: prs.map((pr: any) => ({
              number: pr.number,
              title: pr.title,
              author: pr.user.login,
              state: pr.state,
              url: pr.html_url,
              createdAt: pr.created_at,
              updatedAt: pr.updated_at,
            })),
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * Get repository details
     */
    getRepoDetails: {
      name: 'github:getRepoDetails',
      description: 'Get detailed information about a repository',
      args: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      async execute(args: any) {
        try {
          const { owner, repo } = args;
          const token = process.env.GITHUB_TOKEN;

          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
          }

          const repoData = await response.json();
          return {
            success: true,
            repo: {
              name: repoData.name,
              fullName: repoData.full_name,
              description: repoData.description,
              url: repoData.html_url,
              stars: repoData.stargazers_count,
              forks: repoData.forks_count,
              watchers: repoData.watchers_count,
              language: repoData.language,
              topics: repoData.topics,
              isPrivate: repoData.private,
              isArchived: repoData.archived,
              createdAt: repoData.created_at,
              updatedAt: repoData.updated_at,
              pushedAt: repoData.pushed_at,
            },
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * Trigger GitHub workflow
     */
    triggerWorkflow: {
      name: 'github:triggerWorkflow',
      description: 'Trigger a GitHub Actions workflow',
      args: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        workflowId: { type: 'string', description: 'Workflow ID or filename' },
        ref: { type: 'string', description: 'Branch or tag', default: 'main' },
        inputs: { type: 'object', description: 'Workflow inputs' },
      },
      async execute(args: any) {
        try {
          const { owner, repo, workflowId, ref, inputs } = args;
          const token = process.env.GITHUB_TOKEN;

          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
            {
              method: 'POST',
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ref,
                inputs: inputs || {},
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
          }

          return {
            success: true,
            message: 'Workflow triggered successfully',
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
  },

  hooks: {
    'tool:executed': [
      async (toolName: string, result: any) => {
        if (toolName.startsWith('github:')) {
          console.log(`✓ GitHub tool executed: ${toolName}`);
        }
      },
    ],
  },
};

export default githubPlugin;
