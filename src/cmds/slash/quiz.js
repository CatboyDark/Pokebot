import { createMsg, createRow } from '../../helper/builder.js';
import { randomPoke, format, getRegion } from '../../helper/utils.js';
import { ComponentType } from 'discord.js';

class Quiz {
	constructor() {
		this.players = [];
		this.quizLength = 10;
		this.quizOptions = {
			regions: true,
			types: false,
			evolutions: false,
			gyms: false
		};
		this.questionIndex = 0;
		this.A = '';
	}

	updateLobby(interaction) {
		interaction.update({ 
			embeds: [
				createMsg({
					title: 'Quiz Time!',
					image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/250px-International_Pok%C3%A9mon_logo.svg.png'
				}),
				createMsg({
					title: 'Players',
					desc: this.players.length > 0 ? this.players.map(player => `- ${player.nick}`).join('\n') : 'Empty Lobby!'
				})
			],
			components: [
				createRow([
					{ id: 'toggleRegions', label: 'Regions', style: this.quizOptions.regions ? 'Green' : 'Red' },
					{ id: 'toggleTypes', label: 'Types', style: this.quizOptions.types ? 'Green' : 'Red' },
					{ id: 'toggleEvolutions', label: 'Evolutions', style: this.quizOptions.evolutions ? 'Green' : 'Red' },
					{ id: 'toggleGyms', label: 'Gyms', style: this.quizOptions.gyms ? 'Green' : 'Red' }
				]),
				createRow([
					{ id: 'quizLength10', label: '10 Questions', style: this.quizLength === 10 ? 'Green' : 'Red' },
					{ id: 'quizLength15', label: '15 Questions', style: this.quizLength === 15 ? 'Green' : 'Red' },
					{ id: 'quizLength30', label: '30 Questions', style: this.quizLength === 30 ? 'Green' : 'Red' },
					{ id: 'quizLengthInfinite', label: 'INFINITE Questions', style: this.quizLength === -1 ? 'Green' : 'Red' }
				]),
				createRow([
					{ id: 'QuizJoin', label: 'Join Game', style: 'Blue' },
					{ id: 'QuizStart', label: 'Start', style: 'Blue' }
				])
			]
		});
	}

	async generateQ(interaction) {
		const options = Object.keys(this.quizOptions).filter(key => this.quizOptions[key]);
		const randomQ = options[Math.floor(Math.random() * options.length)];
		let poke;
		let Q;
		
		const regionButtons = createRow(
			[
				{ id: 'regionKanto', label: 'Kanto [I]', style: 'Green' },
				{ id: 'regionJohto', label: 'Johto [II]', style: 'Green' },
				{ id: 'regionHoenn', label: 'Hoenn [III]', style: 'Green' }
			]
		);
		const regionButtons2 = createRow(
			[
				{ id: 'regionSinnoh', label: 'Sinnoh [IV]', style: 'Green' },
				{ id: 'regionUnova', label: 'Unova [V]', style: 'Green' },
				{ id: 'regionKalos', label: 'Kalos [VI]', style: 'Green' }
			]
		);
		const regionButtons3 = createRow(
			[
				{ id: 'regionAlola', label: 'Alola [VII]', style: 'Green' },
				{ id: 'regionGalar', label: 'Galar [VIII]', style: 'Green' },
				{ id: 'regionPaladea', label: 'Paladea [IX]', style: 'Green' }
			]
		);

		if (randomQ === 'regions') {
			buttons = [regionButtons, regionButtons2, regionButtons3];
			poke = await randomPoke();
			Q = `What region is **${format(poke.name)}** from?`;

			this.A = await getRegion(poke.id);
		}
		else if (randomQ === 'types') {

			buttons = typeButtons;
		}
		else if (randomQ === 'evolutions') {
			
			buttons = evoButtons;
		}
		else if (randomQ === 'gyms') {
			
			buttons = typeButtons;
		}

		try {
			await interaction.update({ 
				embeds: [createMsg({ title: `Question ${this.questionIndex + 1}`, desc: Q, image: `https://raw.githubusercontent.com/HybridShivam/Pokemon/master/assets/images/${poke.id.toString().padStart(3, '0')}.png` })],
				components: buttons
			});
		}
		catch (e) {
			console.log(e);
		}

		this.questionIndex++;
	}

	async interactions(interaction) {
		const response = await interaction.fetchReply();
		const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 }); // 1h

		collector.on('collect', async (interaction) => {
			if (interaction.isButton()) {
				const customID = interaction.customId;

				switch (true) {
					case customID.startsWith('toggle'):
					const option = customID.replace('toggle', '').toLowerCase();
					this.quizOptions[option] = !this.quizOptions[option];
					this.updateLobby(interaction);
					break;

					case customID.startsWith('quizLength'):
					this.quizLength = customID === 'quizLengthInfinite' ? -1 : parseInt(customID.replace('quizLength', ''), 10);
					this.updateLobby(interaction);
					break;

					case customID === 'QuizJoin':
					if (!this.players.find(player => player.user === interaction.user.username)) {
						this.players.push({
							user: interaction.user.username,
							nick: interaction.member?.nickname || interaction.user.username
						});	
					}
					else {
						this.players = this.players.filter(player => player.user !== interaction.user.username);
					}
					this.updateLobby(interaction);
					break;

					case customID === 'QuizStart':
					await this.generateQ(interaction);
					break;

					case customID.startsWith('region'):
					const region = customID.replace('region', '');
					const isCorrect = region === this.A;
					const reply = isCorrect ? 'Correct!' : `Incorrect! The correct region is **${this.A}**.`;
					await interaction.reply({
						content: reply
					});
					break;

					default:
					console.error('Unhandled customId:', customID);
					break;
				}
			}
		});
	}

	async start(interaction) {
		this.players.push({
			user: interaction.user.username,
			nick: interaction.member?.nickname || interaction.user.username
		});

		interaction.reply({ 
			embeds: [
				createMsg({
					title: 'Quiz Time!',
					image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/250px-International_Pok%C3%A9mon_logo.svg.png'
				}),
				createMsg({
					title: 'Players',
					desc: this.players.length > 0 ? this.players.map(player => `- ${player.nick}`).join('\n') : 'Empty Lobby!'
				})
			],
			components: [
				createRow([
					{ id: 'toggleRegions', label: 'Regions', style: this.quizOptions.regions ? 'Green' : 'Red' },
					{ id: 'toggleTypes', label: 'Types', style: this.quizOptions.types ? 'Green' : 'Red' },
					{ id: 'toggleEvolutions', label: 'Evolutions', style: this.quizOptions.evolutions ? 'Green' : 'Red' },
					{ id: 'toggleGyms', label: 'Gyms', style: this.quizOptions.gyms ? 'Green' : 'Red' }
				]),
				createRow([
					{ id: 'quizLength10', label: '10 Questions', style: this.quizLength === 10 ? 'Green' : 'Red' },
					{ id: 'quizLength15', label: '15 Questions', style: this.quizLength === 15 ? 'Green' : 'Red' },
					{ id: 'quizLength30', label: '30 Questions', style: this.quizLength === 30 ? 'Green' : 'Red' },
					{ id: 'quizLengthInfinite', label: 'INFINITE Questions', style: this.quizLength === -1 ? 'Green' : 'Red' }
				]),
				createRow([
					{ id: 'QuizJoin', label: 'Join Game', style: 'Blue' },
					{ id: 'QuizStart', label: 'Start', style: 'Blue' }
				])
			]
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
