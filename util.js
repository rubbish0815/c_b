var db = require('byteballcore/db.js');


function readMenuList(parent){
	var arrMenu= [];
	db.query("SELECT * FROM menus WHERE parent = ? visible NOT null", parent, function(rows){
		for (var i = 0; i < rows.length; i++) {
			var object = rows[i];
			arrMenu.push('['+object.name+'](command:to->'+object.menu_id+')');
		}
		return arrMenu.join("\t");
	});
}
