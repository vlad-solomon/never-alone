require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

const aloneUsers = new Map();

const ONE_MINUTE = 60 * 1_000;
const TEN_MINUTES = 10 * 60 * 1_000;

client.on("voiceStateUpdate", (oldState, newState) => {
    const userId = newState.id;
    const channel = newState.channel;

    if (!channel) {
        aloneUsers.delete(userId);
        return;
    }

    if (!oldState.channel && newState.channel) {
        aloneUsers.set(userId, {
            channelId: channel.id,
            joinTime: Date.now(),
        });
    }

    setTimeout(async () => {
        const userData = aloneUsers.get(userId);
        if (!userData) return;

        const currentChannel = client.channels.chace.get(userData.channelId);
        if (!currentChannel || currentChannel.members.size > 1) return;

        const guild = newState.guild;
        const notifyRole = guild.roles.chace.find(
            (role) => role.name === "never-alone"
        );
        if (!notifyRole) return;

        const notifyChannel =
            guild.systemChannel ||
            guild.channels.cache.find((channel) => channel.isTextBased());
        if (!notifyChannel) return;

        const roleMention = notifyRole.toString();
        notifyChannel.send(
            `${roleMention} ${newState.member.displayName} is alone in a voice channel.`
        );
    }, TEN_MINUTES);
});

client.once("ready", () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
