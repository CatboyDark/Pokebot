import fs from 'fs';

function readConfig() {
	return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
}

function writeConfig(newConfig) {
	fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2), 'utf8');
}

function toggleConfig(path) {
	const config = readConfig();
	const keys = path.split('.');
	const lastKey = keys.pop();
	let current = config;

	for (const key of keys) {
		if (current[key] === undefined) {
			return console.log(`Path not found: ${path}`);
		}

		current = current[key];
	}

	if (typeof current[lastKey] !== 'boolean') {
		return console.log('Invalid config!');
	}

	current[lastKey] = !current[lastKey];
	writeConfig(config);
}

function scanDir(dir) { // Credits: Kathund
	let files = [];
	const items = fs.readdirSync(dir);
	items.forEach((item) => {
		const fullPath = `${dir}/${item}`;
		if (fs.statSync(fullPath).isDirectory()) { files = files.concat(scanDir(fullPath)); } 
		else { files.push(fullPath); }
	});
	
	return files;
}

async function readLogic() { // Credits: Kathund
	const foundModules = scanDir('./src/discord/logic')
	.map((path) => { 
		return path.split('src/discord/logic/')[1]; 
	});
	const modules = {};
	for (const modulePath of foundModules) {
		const moduleData = await import(`../discord/logic/${modulePath}`);
		if (modules[modulePath.split('/')[0]] === undefined) modules[modulePath.split('/')[0]] = {};
		modules[modulePath.split('/')[0]][modulePath.split('/')[1].split('.js')[0]] = moduleData;
	};

	return modules;
}

async function getEmoji(name) {
	const url = `https://discord.com/api/v10/applications/${appID}/emojis`;

	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Bot ${token}`
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch emojis: ${response.statusText}`);
		}

		const data = await response.json();
		const emojis = data.items;
		const emoji = emojis.find((e) => e.name === name);
		return emoji ? `<:${emoji.name}:${emoji.id}>` : null;
	}
	catch (error) {
		console.error('Error fetching emoji:', error);
		throw error;
	}
}

async function randomPoke() {
	const getPokeList = await fetch('https://pokeapi.co/api/v2/pokemon/');
	const pokeList = await getPokeList.json();
	const randomPokeID = Math.floor(Math.random() * pokeList.count) + 1;

	const getPoke = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomPokeID}`);
	const poke = await getPoke.json();

	return poke;
}

function format(poke) {
	return poke.split(/(\W+)/).map((word, index) => {
		if (index % 2 === 0) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); }
		return word;
	})
	.join('');
}

async function getRegion(pokeID) {
	const genMap = [
		{ generation: 'generation-i', region: 'Kanto' },
		{ generation: 'generation-ii', region: 'Johto' },
		{ generation: 'generation-iii', region: 'Hoenn' },
		{ generation: 'generation-iv', region: 'Sinnoh' },
		{ generation: 'generation-v', region: 'Unova' },
		{ generation: 'generation-vi', region: 'Kalos' },
		{ generation: 'generation-vii', region: 'Alola' },
		{ generation: 'generation-viii', region: 'Galar' }
	];

	try {
		const getPoke = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeID}`);
		const poke = await getPoke.json();

		const getSpecies = await fetch(poke.species.url);
		const species = await getSpecies.json();

		const generation = species.generation.name;
		const region =  genMap.find(item => item.generation === generation);

		return region ? region.region : 'Unknown';
	}
	catch (e) {
		console.log(e);
	}
}

export 
{
	readConfig,
	writeConfig,
	toggleConfig,
	readLogic,
	getEmoji,
	randomPoke,
	format,
	getRegion
};
