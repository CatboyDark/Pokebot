import { PermissionFlagsBits, ComponentType } from 'discord.js';
import { createMsg, createRow } from '../../helper/builder.js';

async function fetchCommands(interaction) {
	const commands = await interaction.client.application.commands.fetch();
	const cmds = Array.from(commands.values());
	const userPermissions = BigInt(interaction.member.permissions.bitfield);

	const getPermissionName = (permissionBit) => {
		return Object.keys(PermissionFlagsBits).find((key) => PermissionFlagsBits[key] === permissionBit);
	};

	const hasAdminPermission = (userPermissions & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator;

	const hasPermission = (permissions) => {
		if (hasAdminPermission) return true;
		if (!permissions || permissions.length === 0) return true;

		const permissionBits = permissions.reduce((acc, perm) => {
			const permBit = PermissionFlagsBits[perm];
			return acc | BigInt(permBit);
		}, BigInt(0));

		return (userPermissions & permissionBits) === permissionBits;
	};

	const formatCommands = (commands) =>
		commands
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((cmd) => {
				let description = `- **\`/${cmd.name}\`** ${cmd.description}`;
				if (cmd.default_member_permissions) {
					const permissionsRequired = BigInt(cmd.default_member_permissions).toString(2).split('').reverse().map((bit, index) => (bit === '1' ? getPermissionName(2n ** BigInt(index)) : null)).filter(Boolean).join(', ');
					description += ` **(${permissionsRequired})**`;
				}
				return description;
			}).join('\n');

	const nonList = cmds.filter((cmd) => !cmd.default_member_permissions);
	const staffList = cmds.filter((cmd) => cmd.default_member_permissions && hasPermission(cmd.default_member_permissions));

	const nonCommands = `### Commands\n${formatCommands(nonList)}`;
	const staffCommands =
		staffList.length > 0
			? `\n\n### Staff Commands**\n${formatCommands(staffList)}`
			: '';

	return createMsg({
		desc: `${nonCommands}${staffCommands}`,
		footer: 'Created by @CatboyDark',
		footerIcon: 'https://i.imgur.com/ozkS8EH.png'
	});
}

export default {
	name: 'help',
	desc: 'Display bot info',

	async execute(interaction) {
		const helpMsg = await fetchCommands(interaction);

		const buttons = createRow([
			{ id: 'cmds', label: 'Commands', style: 'Green' },
			{ id: 'credits', label: 'Credits', style: 'Blue' },
			{ id: 'support', label: 'Support', style: 'Blue' }
		]);

		if (interaction.isCommand()) {
            await interaction.reply({ embeds: [helpMsg], components: [buttons], withResponse: true });
        }
 		else if (interaction.isButton()) {
            await interaction.update({ embeds: [helpMsg], components: [buttons], withResponse: true });
        }

		const response = await interaction.fetchReply();
		const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 }); // 1h
		collector.on('collect', async interaction => {
			switch (interaction.customId) {
				case 'cmds':
				interaction.update({ embeds: [helpMsg], components: [buttons] });
				break;

				case 'credits':
				interaction.update({ embeds: [createMsg({
					title: 'Credits',
					desc:
						'✦ <@1165302964093722697> ✦\n' +
						'✦ <@486155512568741900> ✦\n' +
						'✦ <@1276524855445164098> ✦\n' +
						'✦ <@468043261911498767> ✦\n\n_ _',
					footer: 'Created by @CatboyDark',
					footerIcon: 'https://i.imgur.com/ozkS8EH.png'
				})], 
				components: [buttons] });
				break;

				case 'support':
				interaction.update({ embeds: [createMsg({
					title: 'Bugs and Support',
					desc: 'Please contact <@622326625530544128> for support!\n\n_ _',
					footer: 'Created by @CatboyDark',
					footerIcon: 'https://i.imgur.com/ozkS8EH.png'
				})], 
				components: [buttons] });
				break;
			}
		});
	}
};
