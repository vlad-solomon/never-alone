require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
} = require("discord.js");

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
                ephemeral: true,
            });
        }

        if (option === "on") {
            if (member.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: "You already have the 'never-alone' role",
                    ephemeral: true,
                });
            }
            await member.roles.add(role);
            return interaction.reply({
                content: "You'll receive notifications when someone's alone",
                ephemeral: true,
            });
        }

        if (option === "off") {
            if (!member.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: "You don't have the 'never-alone' role",
                    ephemeral: true,
                });
            }
            await member.roles.remove(role);
            return interaction.reply({
                content:
                    "You'll no longer receive notifications when someone's alone",
                ephemeral: true,
            });
        }
    }
});

client.once("ready", () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
