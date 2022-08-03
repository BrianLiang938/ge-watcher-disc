const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800;
const height = 600;


module.exports = {
	data: new SlashCommandBuilder()
		.setName('vis')
		.setDescription('Creates graph image')
		.addStringOption(option => option.setName('input').setDescription('Enter a string')),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const api_url = `https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id=${input}`;
		const api_name = `https://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=${input}`;
		const nameJson = await fetch(api_name);
		const request = await fetch(api_url);
		const json = await request.json();
		const n = await nameJson.json();
		const name = n.item.name;
		const size = Object.keys(json.data).length;
		const data = json.data;
		const high = [];
		const low = [];
		const time = [];
		for (let i = 0; i < 160; i++) {
			const h = data[size - 1 - i].avgHighPrice;
			const l = data[size - 1 - i].avgLowPrice;
			const t = data[size - 1 - i].timestamp;
			high.unshift(h);
			low.unshift(l);
			const date = new Date(t * 1000);
			const formattedTime = timeProcess(date);
			time.unshift(formattedTime);
		}
		const title = `${name}`;
		const config = createGraph(low, high, title, time);
		const canvas = new ChartJSNodeCanvas({
			width,
			height,
		});
		const image = await canvas.renderToBuffer(config);
		// https://quickchart.io/chart/render/zm-0bd78cfc-df6e-4d31-b1c1-1fd9d2ef7221?data1=${low}&data2=${high}&title=${title}&labels=${time}
		const attachment = new MessageAttachment(image, 'graph.png');
		const embed = new MessageEmbed()
			.addFields({ name: 'Approx. Offer Price', value: `${low[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, inline: true })
			.addFields({ name: 'Approx. Sell Price', value: `${high[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, inline: true })
			.setImage('attachment://graph.png');
		interaction.channel.send({ embeds: [embed], files: [attachment] });
	},
};

function timeProcess(date) {
	let formattedTime = '';
	const hours = date.getHours();
	const month = date.getMonth();
	const day = date.getDate();
	if (hours == 0) {
		formattedTime = `${month}/${day}`;
	}
	return formattedTime;
}

function createGraph(low, high, title, label) {
	let minimum = low[0];
	let maximum = low[0];
	low.forEach(element => {
		if (element !== null && minimum > element) {
			minimum = element;
		}
		else if (element !== null && maximum < element) {
			maximum = element;
		}
	});
	high.forEach(element => {
		if (element !== null && minimum > element) {
			minimum = element;
		}
		else if (element !== null && maximum < element) {
			maximum = element;
		}
	});
	const config = {
		type: 'line',
		data: {
			labels: label,
			datasets: [{
				label: 'Sell Price',
				data: high,
				fill: false,
				pointRadius: 0,
				borderColor: 'rgb(255,128,0)',
			}, {
				label: 'Offer Price',
				data: low,
				fill: false,
				pointRadius: 0,
				borderColor: 'rgb(0,204,204)',
			}],
		},
		options: {
			legend: {
				display: false,
			},
			plugins: {
				title: {
					display: true,
					text: title,
				},
			},
			scales: {
				x: {
					display: true,
					title: {
						display: true,
						text: 'Time',
					},
					ticks: {
						autoSkip: false,
						maxRotation: 90,
						minRoation: 90,
					},
				},
				y: {
					type: 'linear',
					display: true,
					grace: '10%',
					min: minimum,
					max: maximum,
					ticks: {
						callback: (val) => {
							if (val > 1000000) {
								val = val / 1000000;
								return val.toLocaleString() + 'M';
							}
							if (val > 1000) {
								val = val / 1000;
								return val.toLocaleString() + 'K';
							}
							return val.toLocaleString();
						},
					},
				},
			},
		},
		plugins: [{
			id: 'background-colour',
			beforeDraw: (chart) => {
				const ctx = chart.ctx;
				ctx.save();
				ctx.fillStyle = 'rgb(224,224,224)';
				ctx.fillRect(0, 0, width, height);
				ctx.restore();
			},
		}],
	};
	return config;
}