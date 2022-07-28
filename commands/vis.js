const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800;
const height = 600;
const backgroundColor = 'white';


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
		// const mean = [];
		const time = [];
		for (let i = 0; i < 80; i++) {
			const h = data[size - 1 - i].avgHighPrice;
			const l = data[size - 1 - i].avgLowPrice;
			const t = data[size - 1 - i].timestamp;
			high.unshift(h);
			low.unshift(l);
			// mean.unshift(data.slice(size - 20 - i, size - 1 - i));
			const date = new Date(t * 1000);
			const formattedTime = timeProcess(date);
			time.unshift(formattedTime);
		}
		const title = `Price History of Item ID ${input}`;
		const config = createGraph(low, high, title, time);
		const canvas = new ChartJSNodeCanvas({
			width,
			height,
			backgroundColor,
		});
		const image = await canvas.renderToBuffer(config);
		// https://quickchart.io/chart/render/zm-0bd78cfc-df6e-4d31-b1c1-1fd9d2ef7221?data1=${low}&data2=${high}&title=${title}&labels=${time}
		const attachment = new MessageAttachment(image, 'graph.png');
		const embed = new MessageEmbed()
			.setTitle('Chart')
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
	const config = {
		type: 'line',
		data: {
			labels: label,
			datasets: [{
				label: 'High Price',
				data: high,
				fill: false,
				pointRadius: 0,
			}, {
				label: 'Low Price',
				data: low,
				fill: false,
				pointRadius: 0,
			}],
		},
		options: {
			legend: {
				display: false,
			},
			title: {
				display: true,
				text: title,
			},
			scales: {
				grid: {
					color: 'black',
					display: true,
					borderWidth: 2,
				},
				x: {
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
					grace: '5%',
					min: Math.min(Math.min(...low), Math.min(...high)),
					max: Math.max(Math.max(...low), Math.max(...high)),
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
	};
	return config;
}