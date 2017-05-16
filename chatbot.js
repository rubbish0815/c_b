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
require('byteballcore/wallet.js'); // we don't need any of its functions but it listens for hub/* messages

var appDataDir = desktopApp.getAppDataDir();
var KEYS_FILENAME = appDataDir + '/' + conf.KEYS_FILENAME;

var wallet;

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
	console.warn = console.log;
	console.info = console.log;
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


//*******************************************************************************

function readCurrentState(device_address, handleState){
	db.query("SELECT state_id, `order`, step FROM states WHERE device_address=? ORDER BY state_id DESC LIMIT 1", [device_address], function(rows){
		if (rows.length === 0)
			throw Error('no current state');
		var state = rows[0];
		state.order = JSON.parse(state.order);
		handleState(state);
	});
}

function createNewSession(device_address, onDone){
	var step = 'waiting_for_choice_of_pizza';
	db.query("INSERT INTO states (device_address, step, `order`) VALUES (?,?,'{}')", [device_address, step], function(){
		if (onDone)
			onDone();
	});
}

function updateState(state, onDone){
	db.query(
		"UPDATE states SET step=?, `order`=?, amount=?, address=? WHERE state_id=?", 
		[state.step, JSON.stringify(state.order), state.amount, state.address, state.state_id], 
		function(){
			if (onDone)
				onDone();
		}
	);
}

function cancelState(state){
	db.query("UPDATE states SET cancel_date="+db.getNow()+" WHERE state_id=?", [state.state_id]);
}

//*******************************************************************************

var arrYesNoAnswers = {
		yes: 'Yes',
		no: 'No'
	}

function getYesNoList(){
	var arrItems = [];
	for (var code in arrYesNoAnswers)
		arrItems.push('['+arrYesNoAnswers[code]+'](command:'+code+')');
		return arrItems.join("\t");
}

function readMenuList(parent){
	var arrMenu= [];
	db.query("SELECT * FROM menus WHERE parent = ? AND visible NOT null", parent, function(rows){
		for (var i = 0; i < rows.length; i++) {
			var object = rows[i];
			arrMenu.push('[->'+object.name+'](command:to->'+object.menu_id+')');
		}
		return arrMenu.join("\t");
	});
}

function readMenuListHere(menu_id){
	var arrMenu= [];
	db.query("SELECT * FROM menus WHERE menu_id = ? AND visible NOT null", menu_id, function(rows){
		var object = rows[0];
		arrMenu.push('[->'+object.name+'](command:to->'+object.menu_id+')');
		return arrMenu.join("\t");
	});
}

replaceConsoleLog();


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
});


eventBus.on('paired', function(from_address){
	if (!wallet)
		return handleNoWallet(from_address);
	createNewSession(from_address, function(){
		device.sendMessageToDevice(from_address, 'text', "Hi!\n"+readMenuListHere(0)+"\n"+"Where do you want to go?:\n"+getMenuList(0+1)+"\n");
	});
});

eventBus.on('text', function(from_address, text){
	if (!wallet)
		return handleNoWallet(from_address);
	text = text.trim().toLowerCase();
	console.log(text);
	switch (text) {
	case 'to->':
		break;
	case '<-back':
		break;
	default:
		throw Error("unknown state: "+state);
	}
});






