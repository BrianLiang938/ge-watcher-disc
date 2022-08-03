const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('5m')
		.setDescription('5m analysis. Usage /5m "id"')
		.addStringOption(option => option.setName('input').setDescription('Enter a string')),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const api_url = `https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id=${input}`;
		const api_name = `https://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=${input}`;
		const request = await fetch(api_url);
		const nameJson = await fetch(api_name);
		const json = await request.json();
		const n = await nameJson.json();
		const name = n.item.name;
		const size = Object.keys(json.data).length;
		const data = json.data;
		const vals = [];
		const time = [];
		let avg = 0;
		let count = 0;
		for (let i = 0; i < 20; i++) {
			vals.push(data[size - 1 - i]);
			const high = data[size - 1 - i].avgHighPrice;
			const t = data[size - 1 - i].timestamp;
			if (high != null) {
				count++;
			}

			// time portion
			const date = new Date(t * 1000);
			let hours = date.getHours();
			const minutes = '0' + date.getMinutes();
			const seconds = '0' + date.getSeconds();
			// adds PM AM stuff
			let formattedTime = hours + ':' + minutes.substring(minutes.length - 2) + ':' + seconds.substring(seconds.length - 2) + 'AM';
			if (hours > 12) {
				hours = hours - 12;
				formattedTime = hours + ':' + minutes.substring(minutes.length - 2) + ':' + seconds.substring(seconds.length - 2) + 'PM';
			}
			else if (hours == 0) {
				hours = 12;
				formattedTime = hours + ':' + minutes.substring(minutes.length - 2) + ':' + seconds.substring(seconds.length - 2) + 'AM';
			}
			else if (hours == 12) {
				formattedTime = hours + ':' + minutes.substring(minutes.length - 2) + ':' + seconds.substring(seconds.length - 2) + 'PM';
			}

			time.push(formattedTime);

			const tax = Math.floor(high * 0.01);
			avg += high - tax;
			console.log(high);
		}
		avg = Math.floor(avg / count);
		await interaction.reply('Average price of ' + name + ' is ' + avg + '\nMost recent timestamp is ' + time[0]);
	},
};