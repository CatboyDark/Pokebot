import { createMsg, createRow } from '../../helper/builder.js';
import { ComponentType } from 'discord.js';

class Quiz {
	constructor() {
		this.players = [];
		this.quizLength = 10;
		this.quizOptions = {
			regions: true,
			types: true,
			evolutions: true,
			gyms: true
		};
	}

	createRows() {
		const row1 = createRow([
			{ id: 'toggleRegions', label: 'Regions', style: this.quizOptions.regions ? 'Green' : 'Red' },
			{ id: 'toggleTypes', label: 'Types', style: this.quizOptions.types ? 'Green' : 'Red' },
			{ id: 'toggleEvolutions', label: 'Evolutions', style: this.quizOptions.evolutions ? 'Green' : 'Red' },
			{ id: 'toggleGyms', label: 'Gyms', style: this.quizOptions.gyms ? 'Green' : 'Red' }
		]);

		const row2 = createRow([
			{ id: 'quizLength10', label: '10 Questions', style: this.quizLength === 10 ? 'Green' : 'Red' },
			{ id: 'quizLength15', label: '15 Questions', style: this.quizLength === 15 ? 'Green' : 'Red' },
			{ id: 'quizLength30', label: '30 Questions', style: this.quizLength === 30 ? 'Green' : 'Red' },
			{ id: 'quizLengthInfinite', label: 'INFINITE Questions', style: this.quizLength === -1 ? 'Green' : 'Red' }
		]);

		const row3 = createRow([
			{ id: 'QuizJoin', label: 'Join Game', style: 'Blue' },
			{ id: 'QuizStart', label: 'Start Game', style: 'Blue' }
		]);

		return [row1, row2, row3];
	}

	async interactions(interaction) {
		const response = await interaction.fetchReply();
		const collector = response.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 3_600_000
		});

		collector.on('collect', async (interaction) => {
			if (interaction.isButton()) {
			const customId = interaction.customId;

			switch (true) {
				case customId.startsWith('toggle'):
				const option = customId.replace('toggle', '').toLowerCase();
				this.quizOptions[option] = !this.quizOptions[option];
				break;

				case customId.startsWith('quizLength'):
				this.quizLength = customId === 'quizLengthInfinite' ? -1 : parseInt(customId.replace('quizLength', ''), 10);
				break;

				case customId === 'QuizJoin':
				console.log('Game joined!');
				break;

				case customId === 'QuizStart':
				console.log('Game started!');
				break;

				default:
				console.error('Unhandled customId:', customId);
				break;
			}

			const [row1, row2, row3] = this.createRows();
			await interaction.update({
				embeds: [createMsg({
				title: 'Quiz Time!',
				image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/250px-International_Pok%C3%A9mon_logo.svg.png'
				})],
				components: [row1, row2, row3]
			});
			}
		});

		collector.on('end', (collected, reason) => {
			console.log(`Collector ended due to: ${reason}`);
		});
	}

	async start(interaction) {
		const [row1, row2, row3] = this.createRows();
		await interaction.reply({
		embeds: [createMsg({
			title: 'Quiz Time!',
			image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/250px-International_Pok%C3%A9mon_logo.svg.png'
		})],
		components: [row1, row2, row3]
		});
	} 
}

export default {
	name: 'quiz',
	desc: 'Test your Pokemon knowledge!',

	async execute(interaction) {
		const quiz = new Quiz();
		await quiz.start(interaction);
		await quiz.interactions(interaction);
	}
};
