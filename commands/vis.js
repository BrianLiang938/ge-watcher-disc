const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageAttachment, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vis')
		.setDescription('Creates graph image')
		.addStringOption(option => option.setName('input').setDescription('Enter a string')),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const api_url = `https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id=${input}`;
		const request = await fetch(api_url);
		const json = await request.json();
		const size = Object.keys(json.data).length;
		const data = json.data;
		const high = [];
		const low = [];
		const time = [];
		for (let i = 0; i < 20; i++) {
			const h = data[size - 1 - i].avgHighPrice;
			const l = data[size - 1 - i].avgLowPrice;
			const t = data[size - 1 - i].timestamp;

			high.push(h);
			low.push(l);
			const date = new Date(t * 1000);
			time.push(date);
		}
		const title = `Price History for Item ID ${input}`;
		// https://quickchart.io/chart/render/zm-8142028a-d8c7-4546-88d1-f6b71fac96e2?data1=${low}&data2=${high}&title=${title}&labels=${time}
		const file = new MessageAttachment('https://quickchart.io/chart/render/zm-8142028a-d8c7-4546-88d1-f6b71fac96e2');
		const exampleEmbed = new MessageEmbed()
			.setTitle('Some title')
			.setImage(`https://quickchart.io/chart/render/zm-8142028a-d8c7-4546-88d1-f6b71fac96e2?data1=${low}&data2=${high}`);
		interaction.channel.send({ embeds: [exampleEmbed] });
	},
};