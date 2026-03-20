/**
 * Slack Plugin for Echoctl
 * Enables Slack operations: messages, channels, users, workflows
 */

import { Plugin } from '../../src/services/PluginManager';

export const slackPlugin: Plugin = {
  name: 'slack',
  version: '1.0.0',
  description: 'Slack integration for Echoctl - send messages, manage channels, and more',
  author: 'Manus AI',

  async initialize() {
    console.log('💬 Initializing Slack plugin...');
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      console.warn('⚠️  SLACK_BOT_TOKEN not set. Slack operations will be limited.');
    }
  },

  async destroy() {
    console.log('💬 Destroying Slack plugin...');
  },

  tools: {
    /**
     * Send a message to a Slack channel
     */
    sendMessage: {
      name: 'slack:sendMessage',
      description: 'Send a message to a Slack channel or user',
      args: {
        channel: { type: 'string', description: 'Channel ID or name (e.g., #general, @user)' },
        text: { type: 'string', description: 'Message text' },
        blocks: { type: 'array', description: 'Slack Block Kit blocks' },
        threadTs: { type: 'string', description: 'Thread timestamp for replies' },
      },
      async execute(args: any) {
        try {
          const { channel, text, blocks, threadTs } = args;
          const token = process.env.SLACK_BOT_TOKEN;

          const payload: any = {
            channel,
            text,
          };

          if (blocks) {
            payload.blocks = blocks;
          }

          if (threadTs) {
            payload.thread_ts = threadTs;
          }

          const response = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();

          if (!result.ok) {
            throw new Error(`Slack API error: ${result.error}`);
          }

          return {
            success: true,
            messageTs: result.ts,
            channel: result.channel,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * List Slack channels
     */
    listChannels: {
      name: 'slack:listChannels',
      description: 'List all Slack channels',
      args: {
        excludeArchived: { type: 'boolean', default: true },
        limit: { type: 'number', default: 100 },
      },
      async execute(args: any) {
        try {
          const { excludeArchived, limit } = args;
          const token = process.env.SLACK_BOT_TOKEN;

          const response = await fetch(
            `https://slack.com/api/conversations.list?exclude_archived=${excludeArchived}&limit=${limit}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const result = await response.json();

          if (!result.ok) {
            throw new Error(`Slack API error: ${result.error}`);
          }

          return {
            success: true,
            count: result.channels.length,
            channels: result.channels.map((ch: any) => ({
              id: ch.id,
              name: ch.name,
              isPrivate: ch.is_private,
              isMember: ch.is_member,
              memberCount: ch.num_members,
              topic: ch.topic?.value,
              purpose: ch.purpose?.value,
            })),
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * Get channel information
     */
    getChannelInfo: {
      name: 'slack:getChannelInfo',
      description: 'Get detailed information about a Slack channel',
      args: {
        channel: { type: 'string', description: 'Channel ID or name' },
      },
      async execute(args: any) {
        try {
          const { channel } = args;
          const token = process.env.SLACK_BOT_TOKEN;

          const response = await fetch(`https://slack.com/api/conversations.info?channel=${channel}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const result = await response.json();

          if (!result.ok) {
            throw new Error(`Slack API error: ${result.error}`);
          }

          const ch = result.channel;
          return {
            success: true,
            channel: {
              id: ch.id,
              name: ch.name,
              isPrivate: ch.is_private,
              created: ch.created,
              creator: ch.creator,
              memberCount: ch.num_members,
              topic: ch.topic?.value,
              purpose: ch.purpose?.value,
              isMember: ch.is_member,
            },
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * List users in workspace
     */
    listUsers: {
      name: 'slack:listUsers',
      description: 'List all users in the Slack workspace',
      args: {
        limit: { type: 'number', default: 100 },
      },
      async execute(args: any) {
        try {
          const { limit } = args;
          const token = process.env.SLACK_BOT_TOKEN;

          const response = await fetch(`https://slack.com/api/users.list?limit=${limit}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const result = await response.json();

          if (!result.ok) {
            throw new Error(`Slack API error: ${result.error}`);
          }

          return {
            success: true,
            count: result.members.length,
            users: result.members.map((user: any) => ({
              id: user.id,
              name: user.name,
              realName: user.real_name,
              email: user.profile?.email,
              isBot: user.is_bot,
              isActive: !user.deleted,
            })),
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * Create a Slack reminder
     */
    createReminder: {
      name: 'slack:createReminder',
      description: 'Create a reminder in Slack',
      args: {
        text: { type: 'string', description: 'Reminder text' },
        time: { type: 'string', description: 'Time for reminder (Unix timestamp or relative)' },
        user: { type: 'string', description: 'User ID to remind' },
      },
      async execute(args: any) {
        try {
          const { text, time, user } = args;
          const token = process.env.SLACK_BOT_TOKEN;

          const response = await fetch('https://slack.com/api/reminders.add', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              time,
              user,
            }),
          });

          const result = await response.json();

          if (!result.ok) {
            throw new Error(`Slack API error: ${result.error}`);
          }

          return {
            success: true,
            reminderId: result.reminder.id,
            createdAt: result.reminder.created,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },

    /**
     * Search messages in Slack
     */
    searchMessages: {
      name: 'slack:searchMessages',
      description: 'Search for messages in Slack',
      args: {
        query: { type: 'string', description: 'Search query' },
        sortBy: { type: 'string', enum: ['score', 'timestamp'], default: 'score' },
        limit: { type: 'number', default: 20 },
      },
      async execute(args: any) {
        try {
          const { query, sortBy, limit } = args;
          const token = process.env.SLACK_BOT_TOKEN;

          const response = await fetch(
            `https://slack.com/api/search.messages?query=${encodeURIComponent(query)}&sort=${sortBy}&count=${limit}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const result = await response.json();

          if (!result.ok) {
            throw new Error(`Slack API error: ${result.error}`);
          }

          return {
            success: true,
            totalMatches: result.messages.total,
            messages: result.messages.matches.map((msg: any) => ({
              text: msg.text,
              user: msg.user,
              channel: msg.channel.name,
              timestamp: msg.ts,
              permalink: msg.permalink,
            })),
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
        if (toolName.startsWith('slack:')) {
          console.log(`✓ Slack tool executed: ${toolName}`);
        }
      },
    ],
  },
};

export default slackPlugin;
