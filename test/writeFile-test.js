'use strict';

const assert = require('assert');
const AzureBlobFS = require('../lib/AzureBlobFS');
const { env } = process;
const fs = new AzureBlobFS(env.BLOB_ACCOUNT_NAME, env.BLOB_SECRET, env.BLOB_CONTAINER);
const fsPromise = fs.promise;
const fetch = require('node-fetch');

describe('writeFile', () => {
  context('when write "TEST" to "writeFile.txt"', () => {
    beforeEach(async () => await fsPromise.writeFile('writeFile.txt', 'TEST', { contentSettings: { contentType: 'text/plain' }, metadata: { hello: 'Aloha!' } }));
    afterEach(async () => await fsPromise.unlink('writeFile.txt'));

    it('should have wrote "TEST" to the file', async () => {
      const now = Date.now();
      const token = fs.sas('writeFile.txt', { expiry: now + 15 * 60000, flag: 'r' });
      const url = `https://${ env.BLOB_ACCOUNT_NAME }.blob.core.windows.net/${ env.BLOB_CONTAINER }/writeFile.txt?${ token }`;
      const res = await fetch(url);

      assert.equal(res.status, 200);

      const content = await res.text();

      assert.equal(content, 'TEST');
    });

    context('when stat-ing the file', () => {
      let stat;

      beforeEach(async () => {
        stat = await fsPromise.stat('writeFile.txt', { metadata: true });
      });

      it('should have a file size of 4 bytes', () => {
        assert.equal(stat.size, 4);
      });

      it('should not be a directory', () => {
        assert.equal(stat.isDirectory(), false);
      });

      it('should have metadata "hello" equals to "Aloha!"', () => {
        assert.deepEqual(stat.metadata, { hello: 'Aloha!' });
      });

      it('should have "Content-Settings" set to "text/plain"', () => {
        assert.equal(stat.contentSettings.contentType, 'text/plain');
      });
    });
  });
});
