//loads the buggy module and then replaces it with the pach

const mod = require('module');
const patch = require('./rocky-clone-request');

const buggyModulePath = './node_modules/rocky/lib/helpers/clone-request';
const original = require(buggyModulePath)

mod._cache[require.resolve(buggyModulePath)].exports=patch;