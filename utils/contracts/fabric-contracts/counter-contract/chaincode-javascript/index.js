/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const counterContract = require('./lib/Counter.js');

module.exports.CounterContract = counterContract;
module.exports.contracts = [counterContract];
