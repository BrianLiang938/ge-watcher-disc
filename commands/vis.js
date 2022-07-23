const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
const QuickChart = require('quickchart-js');

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
		for (let i = 0; i < 96; i++) {
			const h = data[size - 1 - i].avgHighPrice;
			const l = data[size - 1 - i].avgLowPrice;
			const t = data[size - 1 - i].timestamp;
			high.unshift(h);
			low.unshift(l);
			const date = new Date(t * 1000);
			const hours = date.getHours();
			const formattedTime = timeProcess(hours);
			time.unshift(formattedTime);
		}
		const title = `Price History of Item ID ${input}`;
		const chart = createGraph(low, high, title, time);
		const url = await chart.getShortUrl();
		console.log(url);
		// https://quickchart.io/chart/render/zm-0bd78cfc-df6e-4d31-b1c1-1fd9d2ef7221?data1=${low}&data2=${high}&title=${title}&labels=${time}
		const exampleEmbed = new MessageEmbed()
			.setImage(url);
		interaction.channel.send({ embeds: [exampleEmbed] });
	},
};

function timeProcess(hours) {
	let formattedTime = hours + 'AM';
	if (hours > 12) {
		hours = hours - 12;
		formattedTime = hours + 'PM';
	}
	else if (hours == 0) {
		hours = 12;
		formattedTime = hours + 'AM';
	}
	else if (hours == 12) {
		formattedTime = hours + 'PM';
	}
	return formattedTime;
}

function createGraph(low, high, title, label) {
	const myChart = new QuickChart();
	myChart.setConfig({
		type: 'line',
		data: {
			labels: label,
			datasets: [{
				label: 'High Price',
				data: high,
				fill: false,
			}, {
				label: 'Low Price',
				data: low,
				fill: false,
			}],
		},
		options: {
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
					type: 'time',
					time: {
						unit: 'hour',
					},
					title: {
						display: true,
						text: 'Time',
					},
				},
				y: {
					type: 'linear',
					grace: '5%',
					min: Math.min(Math.min(...low), Math.min(...high)),
					max: Math.max(Math.max(...low), Math.max(...high)),
				},
				yAxes: {
					ticks: {
						// Include a dollar sign in the ticks
						callback: function(value) {
							return '$' + value;
						},
					},
				},
			},
		},
	});
	myChart.setBackgroundColor('rgb(192,192,192)').setWidth(800);
	return myChart;
}