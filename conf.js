/*jslint node: true */
"use strict";

exports.port = null;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = false;
exports.bIgnoreUnpairRequests = true;


exports.storage = 'sqlite';

exports.hub = 'byteball.org/bb';
exports.deviceName = 'Chatbot';
exports.permanent_paring_secret = '0000';
exports.KEYS_FILENAME = 'keys.json';

// home wallet (replace these values with the properties of your wallet that is to collect the revenue from sales)
exports.xPubKey = 'xpub6BzAgCM5SG1EeAbQsAhbbHaQLaRVCN1g9VqLTQBMLZjPP8SCRpHigj5y3LtechaFL6ZkCzbJwXT6qNv2fPxGxd3vSpULy1mfaVsgfuXax9T';
exports.account = 6;
exports.homeDeviceAddress = '04C4OWDAUCRTBEEDB3E5IHKFGB3UKVXCF';


console.log('finished chatbot conf');
