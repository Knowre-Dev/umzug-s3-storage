const
	AWS = require('aws-sdk');

module.exports = class S3Storage {
	constructor (option) {
		const
			profile = option.profile || 'default',
			credentials = new AWS.SharedIniFileCredentials({profile: profile}),
			accessKeyId = option.accessKeyId || credentials.accessKeyId,
			secretAccessKey = option.secretAccessKey || credentials.secretAccessKey;

		this._credentials = {
			accessKeyId,
			secretAccessKey
		};

		this._option = {
			bucket: option.bucket,
			name: option.name
		};

		this._s3 = new AWS.S3(this._credentials);
	}

	async logMigration (migrationName) {
		try {
			const
				currentLog = await this.getCurrentLog();
			
			currentLog.push(migrationName);

			await this._s3.upload({
				Bucket: this._option.bucket,
				Key: this._option.name,
				Body: JSON.stringify(currentLog)
			}).promise();

			return migrationName;
		} catch (e) {
			console.error(e);
			process.exit(-1);
		}
	}

	async unlogMigration (migrationName) {
		try {
			const
				currentLog = await this.getCurrentLog(),
				nextLog = currentLog.filter((i) => (i !== migrationName));

			await this._s3.upload({
				Bucket: this._option.bucket,
				Key: this._option.name,
				Body: JSON.stringify(nextLog)
			}).promise();

			return migrationName;
		} catch (e) {
			console.error(e);
			process.exit(-1);
		}
	}

	async executed () {
		try {
			const
				currentLog = await this.getCurrentLog();

			return currentLog;
		} catch (e) {
			console.error(e);
			process.exit(-1);
		}
	}

	async getCurrentLog () {
		try {
			const
				data = await this._s3.getObject({
					Bucket: this._option.bucket,
					Key: this._option.name
				}).promise();

			return JSON.parse(data.Body.toString());
		} catch (e) {
			if (e.code !== 'NoSuchKey') {
				console.error(e);
				process.exit(-1);
			} else {
				return [];
			}
		}
	}

	async removeLog () {
		try {
			await this._s3.deleteObject({
				Bucket: this._option.bucket,
				Key: this._option.name
			}).promise();

			return [];
		} catch (e) {
			console.error(e);
			process.exit(-1);
		}
	}
};
