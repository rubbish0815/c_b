/*jslint node: true */
"use strict";
var check_daemon = require('byteballcore/check_daemon.js');

check_daemon.checkDaemonAndRestart('node chatbot.js', 'node chatbot.js > log');

