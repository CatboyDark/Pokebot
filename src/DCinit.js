import { Client, Partials, Collection, GatewayIntentBits, REST, Routes, ActivityType } from 'discord.js';
import { createMsg, createSlash } from './helper/builder.js';
import auth from '../auth.json' with { type: 'json' };
import config from '../config.json' with { type: 'json' };
import fs from 'fs';

class DC {
	constructor() {
		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.GuildScheduledEvents
			],
			partials: [
				Partials.Message,
				Partials.Channel,
				Partials.GuildMember,
				Partials.User
			]
		});
		
		this.client.pc = new Collection();
		this.client.sc = new Collection();
	}

	async init() {
		await this.initCmds();
		await this.initEvents();
		this.login();
		// await this.initEmojis();
	}

	async initCmds() { // Credit: Kathund
		const slashDir = fs.readdirSync('./src/cmds/slash').filter((file) => file.endsWith('.js'));
		const slashCommands = [];
		for (const slashFile of slashDir) {
			const slashCommand = (await import(`./cmds/slash/${slashFile}`)).default;
			const slashCmd = createSlash(slashCommand);
			this.client.sc.set(slashCmd.data.name, slashCmd);
			slashCommands.push(slashCmd.data.toJSON());
		}

		const rest = new REST({ version: '10' }).setToken(auth.token);
		await rest.put(Routes.applicationCommands(Buffer.from(auth.token.split('.')[0], 'base64').toString('ascii')), { body: slashCommands }); 

		const plainDir = fs.readdirSync('./src/cmds/plain').filter(file => file.endsWith('.js'));
		for (const plainFile of plainDir) {
			const cmdData = await import(`./cmds/plain/${plainFile}`);
			this.client.pc.set(cmdData.name, cmdData);
		};

		this.client.on('messageCreate', async(message) => {
			if (message.author.bot) return;
			
			const args = message.content.trim().split(/ +/);
			const commandName = args.shift().toLowerCase();

			if (this.client.pc.has(commandName)) {
				const command = this.client.pc.get(commandName);
				await command.execute(message, args);
			}
		});
	}

	async initEvents() { // Credit: Kathund
		const eventDir = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
		for (const eventFile of eventDir) {
			const event = (await import(`./events/${eventFile}`)).default;
			this.client.on(event.name, (...args) => event.execute(...args));
		};
	}

	async initEmojis() { // Credit: Kathund
		try {
			const application = await this.client.application.fetch();
			const currentEmojis = await application.emojis.fetch();
			const emojiFiles = fs.readdirSync('./assets/emojis').filter((file) => file.endsWith('.png'));
			emojiFiles.forEach((emoji) => {
				if (currentEmojis.has(emoji.split('.')[0])) return;
				application.emojis
					.create({ attachment: `./assets/emojis/${emoji}`, name: emoji.split('.')[0] })
					.then((emoji) => { return console.log(`Uploaded ${emoji.name}`); })
					.catch(console.error);
			});
		}
		catch (e) {
			console.error(`Failed to initialize emojis: ${e.message}`);
		}
	}

	login() {
		this.client.login(auth.token);

		this.client.on('ready', () => {
			if (config.logsChannel) {
				const channel = this.client.channels.cache.get(config.logsChannel);
				channel.send({ embeds: [createMsg({ desc: '**Pokebot is Online!**' })] });
			}
			if (auth.guild) {
				this.client.user.setActivity(auth.guild, {
					type: ActivityType.Watching
				});
			}
			console.log('Pokebot is online!');
		});
	}
}

export default DC;
