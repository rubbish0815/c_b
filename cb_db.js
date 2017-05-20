var db = require('byteballcore/db.js');

function readCurrentSession(device_address, handleSession){
	db.query("SELECT navitem_id FROM cb_sessions WHERE device_address=? LIMIT 1", [device_address], function(rows){
		if (rows.length === 0)
			throw Error('no current session');
		var session = rows[0];
		handleSession(session);
	});
}

function createNewSession(device_address, onDone){
	var navItem_Id = '1';
	db.query("INSERT INTO cb_sessions (device_address, navitem_id) VALUES (?,?)", [device_address, navItem_Id], function(){
		if (onDone)
			onDone();
	});
}

function updateSession(session, onDone){
	db.query(
		"UPDATE cb_sessions SET navitem_id=? WHERE device_address=?", 
		[session.navitem_id, session.device_address], 
		function(){
			if (onDone)
				onDone();
		}
	);
}

function readNavItemListForParent(parent, handleNavItemList){
	db.query("SELECT * FROM cb_navitems WHERE parent = ? AND begda <= Date() AND endda >= Date()", parent, function(rows){
		if (rows.length === 0)
			throw Error('no NavItems available);
		handleNavItemList(rows);
	});
}

function readNavItem(navItemId, handleNavItem){
	var arrMenu= [];
	db.query("SELECT * FROM cb_navitems WHERE id = ? AND begda <= Date() AND endda >= Date()", navItemId, function(rows){
		if (rows.length === 0)
			throw Error('no NavItem available);
		var navItem = rows[0];
		handleNavItem(navItem);
	});
}


function readNavItemContentList(navItemId, handleNavItemContentList){
	var arrContent = {}
	db.query("SELECT content FROM cb_navitemcontent INNER JOIN cb_content WHERE navitem_id = ? AND begda <= Date() AND endda >= Date()", 
			navItemId, function(rows){
		if (rows.length === 0)
			throw Error('no NavItems available);
		for (var i = 0; i < rows.length; i++) {
			arrContent.push(rows[i].content+"\n");
			return arrItems.join("\n");
		}
	});
}


module.exports.readCurrentSession = readCurrentSession;
module.exports.createNewSession = createNewSession;
module.exports.updateSession = updateSession;
module.exports.readNavItemListForParent = readNavItemListForParent;
module.exports.readNavItem = readNavItem;
module.exports.readNavItemContentList = readNavItemContentList;

