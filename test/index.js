import test from 'ava';

const
	Umzug = require('umzug'),
	path = require('path'),
	Storage = require('../lib'),
	option = {
		// accessKeyId: '',
		// secretAccessKey: '',
		// profile: 'default', // AWS CLI profile
		bucket: process.env.UMZUG_S3_STORAGE_BUCKET,
		name: 'umzug-s3-storage-test'
	},
	myStorage = new Storage(option),
	myUmzug = new Umzug({
		storage: myStorage,
		migrations: {
			params: [],
			path: path.join(__dirname, 'migrations'),
			pattern: /^\d+.js$/
		}
	});

test.before('cleanup', async () => {
	await myStorage.removeLog();
});

test(async t => {
	let	result,
		data;

	result = await myUmzug.up({ to: '2' }),
	data = await myStorage.getCurrentLog();

	t.deepEqual(data, ['0.js', '1.js', '2.js']);
	t.is(result.length, 3);

	result = await myUmzug.down(),
	data = await myStorage.getCurrentLog();

	t.deepEqual(data, ['0.js', '1.js']);
	t.is(result.length, 1);

	result = await myUmzug.up(),
	data = await myStorage.getCurrentLog();

	t.deepEqual(data, ['0.js', '1.js', '2.js']);
	t.is(result.length, 1);

	result = await myUmzug.down({ to: 0 }),
	data = await myStorage.getCurrentLog();

	t.deepEqual(data, []);
	t.is(result.length, 3);
});

test.after('cleanup', async () => {
	await myStorage.removeLog();
});
