/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');

class Counter extends Contract {

    async WriteDataNoEvent(ctx, data) {
        if (!data || data.length === 0) {
            throw new Error('Data must be a non-empty string');
        }

        await ctx.stub.putState('newKey', Buffer.from(JSON.stringify({ key: 'newKey', data: data })));

        return true;
    }

    async WriteData(ctx, key, data) {
        if (!data || data.length === 0) {
            throw new Error('Data must be a non-empty string');
        }

        await ctx.stub.putState(key, Buffer.from(JSON.stringify({ key: key, data: data })));

        ctx.stub.setEvent('WriteData', Buffer.from(JSON.stringify({ key: key, data: data })));

        return true;
    }

    async ReadData(ctx, key) {
        const dataBytes = await ctx.stub.getState(key);
        if (!dataBytes || dataBytes.length === 0) {
            throw new Error(`there is no data stored in the ledger with key: ${key}`);
        }

        const dataString = dataBytes.toString();

        const data = JSON.parse(dataString);

        return data.data;
    }
}

module.exports = Counter;
