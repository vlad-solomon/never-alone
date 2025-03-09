require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    MessageFlags,
} = require("discord.js");
const TEN_MINUTES = 10 * 60 * 1_000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

const userTimers = new Map();

client.on("voiceStateUpdate", (_, newState) => {
    const userId = newState.id;
    const channel = newState.channel;

    if (!channel) {
        if (userTimers.has(userId)) {
            clearTimeout(userTimers.get(userId));
            userTimers.delete(userId);
        }
        return;
    }

    if (userTimers.has(userId)) return;

    const timer = setTimeout(async () => {
        const currentChannel = client.channels.cache.get(userData.channelId);
        if (!currentChannel || currentChannel.members.size > 1) return;

        const guild = newState.guild;
        const notifyRole = guild.roles.cache.find(
            (role) => role.name === "never-alone"
        );
        if (!notifyRole) return;

        const notifyChannel =
            guild.systemChannel ||
            guild.channels.cache.find((channel) => channel.isTextBased());
        if (!notifyChannel) return;

        const roleMention = notifyRole.toString();
        notifyChannel.send(
            `<@${newState.member.id}> is alone in <#${newState.channelId}>. Join them! ${roleMention} `
        );

        userTimers.delete(userId);
    }, TEN_MINUTES);

    userTimers.set(userId, timer);
});

const commands = [
    new SlashCommandBuilder()
        .setName("never-alone")
        .setDescription("Manage your 'never-alone' role")
        .addStringOption((option) =>
            option
                .setName("option")
                .setDescription(
                    "Choose whether to be notified or not when someone's alone. Add or remove the 'never-alone' role."
                )
                .setRequired(true)
                .addChoices(
                    { name: "on", value: "on" },
                    { name: "off", value: "off" }
                )
        ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            {
                body: commands,
            }
        );
        console.log("Slash commands registered successfully");
    } catch (error) {
        console.error({ message: "Error registering commands", error });
    }
})();

client.on("guildCreate", async (guild) => {
    console.log(`Joined a new guild: ${guild.name}`);

    const exisitingRole = guild.roles.cache.find(
        (role) => role.name === "never-alone"
    );
    if (!exisitingRole) {
        try {
            const newRole = await guild.roles.create({
                name: "never-alone",
                color: "Blue",
                mentionable: true,
                reason: "Automatically created for the Never Alone bot",
            });
            console.log(
                `Create 'never-alone' role in ${guild.name}: ${newRole.id}`
            );
        } catch (error) {
            console.error({
                message: `Failed to create a role in ${guild.name}`,
                error,
            });
        }
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "never-alone") {
        const option = interaction.options.getString("option");
        const member = interaction.member;
        const role = interaction.guild.roles.cache.find(
            (role) => role.name === "never-alone"
        );

        if (!role) {
            return interaction.reply({
                content: "The 'never-alone' does not exist.",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (option === "on") {
            if (member.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: "You already have the 'never-alone' role",
                    flags: MessageFlags.Ephemeral,
                });
            }
            await member.roles.add(role);
            return interaction.reply({
                content: "You'll receive notifications when someone's alone",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (option === "off") {
            if (!member.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: "You don't have the 'never-alone' role",
                    flags: MessageFlags.Ephemeral,
                });
            }
            await member.roles.remove(role);
            return interaction.reply({
                content:
                    "You'll no longer receive notifications when someone's alone",
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});

client.once("ready", () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
