CREATE TABLE IF NOT EXISTS menus (
	menu_id INTEGER PRIMARY KEY NOT NULL UNIQUE, 
	parent INTEGER NOT NULL,
	name VARCHAR,
	visible BOOL,
);

INSERT INTO menus VALUES (menu_id, parent, name, visible),[1, 0, 'Home', ]);
INSERT INTO menus VALUES (menu_id, parent, name, visible),[2, 1, 'News', ]);
INSERT INTO menus VALUES (menu_id, parent, name, visible),[3, 1, 'Wiki', ]);
INSERT INTO menus VALUES (menu_id, parent, name, visible),[4, 1, 'Services', ]);
INSERT INTO menus VALUES (menu_id, parent, name, visible),[5, 1, 'Stats', ]);

CREATE TABLE states (
    device_address CHAR(33) NOT NULL PRIMARY KEY,
    menu_id INTEGER NOT NULL,
    change_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_address) REFERENCES correspondent_devices(device_address),
);

CREATE INDEX byStatesDeviceAddress ON states(device_address);
