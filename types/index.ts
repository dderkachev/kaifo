import { SlashCommandBuilder } from 'discord.js';

export interface Config {
  token: string;
  applicationId: string;
  serverId: string;
}

export interface Command {
  data: SlashCommandBuilder;
}
