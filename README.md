# Never Alone - Discord Bot

Never Alone is a simple Discord bot that notifies users when someone is alone in a voice channel. It allows users to opt in or out of notifications using slash commands. The bot automatically creates the required role (`never-alone`) when it joins a server.

---

## Features

-   **Automatic Role Creation**: The bot creates the `never-alone` role when it joins a server.
-   **User Opt-in/Opt-out**: Users can enable or disable notifications using slash commands.
-   **Voice Channel Monitoring**: If a user is alone in a voice channel for 10 minutes, the bot notifies users with the `never-alone` role.
-   **Clean Notifications**: Users with the role receive a ping, with the user that's alone and the voice channel.

---

## Installation

1. **Invite the Bot to Your Server**

    - Ensure the bot has the following permissions:
        - Manage Roles
        - Send Messages
        - Read Message History
        - Use Application Commands
        - Mention @everyone, @here, and All Roles

2. **Once added, the bot will automatically create the `never-alone` role**.

---

## Usage

### **1. Opt-in for Notifications**

Users who want to be notified when someone is alone in a voice channel should use:

```
never-alone on
```

This adds the `never-alone` role to them.

### **2. Opt-out of Notifications**

If a user no longer wants to receive notifications, they can remove the role with:

```
never-alone off
```

### **3. How Notifications Work**

-   If a user joins a **voice channel alone**, a 10-minute timer starts.
-   If no one else joins within 10 minutes, the bot notifies users with the `never-alone` role.
-   Example notification:

```
@User1 is alone in #general-voice. Join them!
```

## Invite it by clicking [here](https://discord.com/oauth2/authorize?client_id=1347650089421901894)!
