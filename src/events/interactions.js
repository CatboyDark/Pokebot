import { readConfig } from '../helper/utils.js';
import { Team, Events } from 'discord.js';
import { createMsg } from '../helper/builder.js';

export default
{
	name: Events.InteractionCreate,

	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			try {
				const command = interaction.client.sc.get(interaction.commandName);
				await command.execute(interaction);
			}
			catch (error) {
				console.log(error);
				const config = readConfig();
				const channel = await interaction.client.channels.fetch(config.logsChannel);
				const app = await interaction.client.application.fetch();
				await channel.send({ 
					content: `<@${app.owner instanceof Team ? app.owner.ownerId : app.owner.id}>`, 
					embeds: [createMsg({ color: 'Red', title: 'A Silly Has Occured!', desc: `\`${error.message}\`\n\n**If you believe this is a bug, please contact <@622326625530544128>.**` })] 
				});

				if (interaction.replied || interaction.deferred) return interaction.followUp({ embeds: [createMsg({ color: 'Red', title: 'Oops! That wasn\'t supposed to happen!', desc: 'Staff has been notified. Thank you for your patience!' })] });
				return interaction.reply({ embeds: [createMsg({ color: 'Red', title: 'Oops! That wasn\'t supposed to happen!', desc: 'Staff has been notified. Thank you for your patience!' })] });
			}
		}
	}
};
