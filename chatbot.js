/*jslint node: true */
"use strict";
var util = require('util');
var conf = require('byteballcore/conf.js');
var device = require('byteballcore/device.js');
var walletDefinedByKeys = require('byteballcore/wallet_defined_by_keys.js');
var crypto = require('crypto');
var fs = require('fs');
var db = require('byteballcore/db.js');
var eventBus = require('byteballcore/event_bus.js');
var desktopApp = require('byteballcore/desktop_app.js');
var cb_db = require('./cb_db.js');
require('byteballcore/wallet.js'); // we don't need any of its functions but it listens for hub/* messages

var appDataDir = desktopApp.getAppDataDir();
var KEYS_FILENAME = appDataDir + '/' + conf.KEYS_FILENAME;

var wallet;

var CMDTO = 'To->';

function replaceConsoleLog(){
	var log_filename = conf.LOG_FILENAME || (appDataDir + '/log.txt');
	var writeStream = fs.createWriteStream(log_filename);
	console.log('---------------');
	console.log('From this point, output will be redirected to '+log_filename);
	console.log("To release the terminal, type Ctrl-Z, then 'bg'");
	console.log = function(){
		writeStream.write(Date().toString()+': ');
		writeStream.write(util.format.apply(null, arguments) + '\n');
	};
//	console.warn = console.log;
//	console.info = console.log;
}

function readKeys(onDone){
	fs.readFile(KEYS_FILENAME, 'utf8', function(err, data){
		if (err){
			console.log('failed to read keys, will gen');
			var devicePrivKey = crypto.randomBytes(32);
			var deviceTempPrivKey = crypto.randomBytes(32);
			var devicePrevTempPrivKey = crypto.randomBytes(32);
			writeKeys(devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey, function(){
				onDone(devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey);
			});
			return;
		}
		var keys = JSON.parse(data);
		onDone(Buffer(keys.permanent_priv_key, 'base64'), Buffer(keys.temp_priv_key, 'base64'), Buffer(keys.prev_temp_priv_key, 'base64'));
	});
}

function writeKeys(devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey, onDone){
	var keys = {
		permanent_priv_key: devicePrivKey.toString('base64'),
		temp_priv_key: deviceTempPrivKey.toString('base64'),
		prev_temp_priv_key: devicePrevTempPrivKey.toString('base64')
	};
	fs.writeFile(KEYS_FILENAME, JSON.stringify(keys), 'utf8', function(err){
		if (err)
			throw Error("failed to write keys file");
		if (onDone)
			onDone();
	});
}

function createWallet(onDone){
	walletDefinedByKeys.createSinglesigWalletWithExternalPrivateKey(conf.xPubKey, conf.account, conf.homeDeviceAddress, function(_wallet){
		wallet = _wallet;
		onDone();
	});
}

function handleNoWallet(from_address){
	if (from_address === conf.homeDeviceAddress && wallet === null)
		createWallet(function(){
			device.sendMessageToDevice(from_address, 'text', "Chatbot created, all new addresses will be synced to your device");
		});
	else
		device.sendMessageToDevice(from_address, 'text', "Chatbot is not set up yet, try again later");
}

function getContent(device_address, to, onDone) {
	var arrContent = [];
	var arrNavContent = [];
	cb_db.readNavItemListForParent(to, function(arrNavItemList){
		arrContent = !arrNavItemList ? arrContent : arrNavItemList;		
		cb_db.readNavItemContentList(to, function(arrNavItemContent) {
			for (var i = 0; i < arrNavItemContent.length; i++) {
				arrContent.push(arrNavItemContent[i]);
			}
			onDone(arrContent.join("\n"));
		})
	});
}


if (!conf.permanent_paring_secret)
	throw Error('no conf.permanent_paring_secret');
	db.query("INSERT "+db.getIgnore()+" INTO pairing_secrets (pairing_secret, expiry_date, is_permanent) VALUES(?, '2035-01-01', 1)", 
			[conf.permanent_paring_secret]);

	db.query("SELECT wallet FROM wallets", function(rows){
		if (rows.length > 1)
			throw Error('more than 1 wallet');
		if (rows.length === 1)
			wallet = rows[0].wallet;
		else
			wallet = null; // different from undefined
});
	

readKeys(function(devicePrivKey, deviceTempPrivKey, devicePrevTempPrivKey){
	var saveTempKeys = function(new_temp_key, new_prev_temp_key, onDone){
		writeKeys(devicePrivKey, new_temp_key, new_prev_temp_key, onDone);
	};
	device.setDevicePrivateKey(devicePrivKey);
	device.setTempKeys(deviceTempPrivKey, devicePrevTempPrivKey, saveTempKeys);
	device.setDeviceName(conf.deviceName);
	device.setDeviceHub(conf.hub);
	var my_device_pubkey = device.getMyDevicePubKey();
	console.log("my device pubkey: "+my_device_pubkey);
	console.log("my pairing code: "+my_device_pubkey+"@"+conf.hub+"#"+conf.permanent_paring_secret);
	replaceConsoleLog();
});



eventBus.on('paired', function(from_address){
	if (!wallet)
		return handleNoWallet(from_address);
	cb_db.createNewSession(from_address, function(){
		getContent(from_address, 1, function(arrContent) {
			device.sendMessageToDevice(from_address, 'text', arrContent+"\n");			
		})

	});
});

eventBus.on('text', function(from_address, text){
	if (!wallet)
		return handleNoWallet(from_address);
	text = text.trim().toLowerCase();
	console.info(from_address+'**'+text);
	var split = text.split("->", 2);
	switch (split[0]) {
	case 'to':
		getContent(from_address, split[1], function(response) {
			device.sendMessageToDevice(from_address, 'text', response );
		})
		break;
	default:
		device.sendMessageToDevice(from_address, 'text', "Command "+text+" not available." );
	}
});