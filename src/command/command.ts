import Discord, {
  BaseCommandInteraction,
  ContextMenuInteraction,
  GuildMember,
  Snowflake,
  User,
  VoiceChannel,
} from 'discord.js';
import { MusicSubscription } from '../music/subscription';

export type Route = {
  interaction?: BaseCommandInteraction;
  message?: Discord.Message;
};

export type CommonMessage = {
  content: string;
  ephemeral?: boolean;
  followUp?: boolean;
};

export type metadataOptions = {
  name: string;
  type: string;
  description: string;
  required: boolean;
};

export type commandMetadata = {
  name: string;
  description: string;
  options?: metadataOptions[];
  ignoreSlash?: boolean;
};

export abstract class Command {
  client: Discord.Client;
  subscriptions: Map<Snowflake, MusicSubscription>;
  metadata?: commandMetadata;

  constructor(client: Discord.Client, subscriptions: Map<Snowflake, MusicSubscription>) {
    this.client = client;
    this.subscriptions = subscriptions;
  }

  public abstract execute(route: Route): Promise<void>;

  async getSubscription(route: Route, required = true): Promise<MusicSubscription | undefined> {
    const subscription = this.subscriptions.get(route.interaction?.guildId ?? route.message?.guildId ?? '');

    if (!subscription && required) {
      await this.reply({ content: 'Not playing in this server!' }, route);
    }

    return subscription;
  }

  setSubscription(route: Route, subscription: MusicSubscription): void {
    this.subscriptions.set(route.interaction?.guildId ?? route.message?.guildId ?? '', subscription);
  }

  removeSubscription(route: Route): void {
    this.subscriptions.delete(route.interaction?.guildId ?? route.message?.guildId ?? '');
  }

  getChannel(route: Route): VoiceChannel | undefined {
    const routing = route.interaction ?? route.message ?? undefined;
    if (
      routing &&
      routing &&
      routing.member instanceof GuildMember &&
      routing.member.voice.channel &&
      routing.member.voice.channel instanceof VoiceChannel
    ) {
      return routing.member.voice.channel;
    }
  }

  getUser(route: Route): User | undefined {
    return route.interaction?.user ?? route.message?.author;
  }

  getArgument(route: Route): string {
    if (route.interaction && this.metadata?.options) {
      return (route.interaction as ContextMenuInteraction).options.get(this.metadata?.options[0].name)!
        .value! as string;
    }

    if (route.message && route.message.content) {
      return route.message.content.split(' ').slice(1).join(' ');
    }

    return '';
  }

  async reply(message: CommonMessage, route: Route): Promise<void> {
    if (!message || !message.content) {
      console.error(`Cannot reply without content`);
      return;
    }

    if (!route || (!route.interaction && !route.message)) {
      console.error(`Cannot reply without route: ${message}`);
      return;
    }

    if (route.interaction) {
      await (message.followUp ? route.interaction.followUp(message) : route.interaction.reply(message));
    } else if (route.message) {
      route.message.reply(message.content);
    }
  }
}
