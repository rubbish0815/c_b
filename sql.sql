--
-- NavItems
--
DROP TABLE IF EXISTS cb_navitems;

CREATE TABLE IF NOT EXISTS cb_navitems (
	id INTEGER PRIMARY KEY NOT NULL UNIQUE, 
	parent INTEGER NOT NULL,
	name VARCHAR,
	begda DATE NOT NULL,
	endda DATE NOT NULL
);

INSERT INTO cb_navitems (id, parent, name, begda, endda) VALUES (1, 0, 'Home', '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitems (id, parent, name, begda, endda) VALUES (2, 1, 'News', '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitems (id, parent, name, begda, endda) VALUES (3, 1, 'Wiki', '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitems (id, parent, name, begda, endda) VALUES (4, 1, 'Services', '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitems (id, parent, name, begda, endda) VALUES (5, 1, 'Stats', '2017-01-01', '9999-12-31' );

--
-- Sessions 
--
DROP TABLE IF EXISTS cb_sessions;

CREATE TABLE IF NOT EXISTS cb_sessions (
	device_address CHAR(33) NOT NULL,
	navitem_id INTEGER,
    change_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_address) REFERENCES correspondent_devices(device_address) ON DELETE CASCADE,
    FOREIGN KEY (navitem_id) REFERENCES cb_navitems(id) ON DELETE CASCADE
);

CREATE INDEX bySessionsDeviceAddress ON cb_sessions(device_address);

--
-- Content for NavItems 
--
DROP TABLE IF EXISTS cb_content;

CREATE TABLE IF NOT EXISTS cb_content (
	id INTEGER PRIMARY KEY NOT NULL UNIQUE,
	content TEXT,
    begda DATE NOT NULL,
    endda DATE NOT NULL
);

INSERT INTO cb_content VALUES (1, 'Test 1', '2017-01-01', '9999-12-31' );
INSERT INTO cb_content VALUES (2, 'Test 2', '2017-01-01', '9999-12-31' );
INSERT INTO cb_content VALUES (3, 'Test 3', '2017-01-01', '9999-12-31' );
INSERT INTO cb_content VALUES (4, 'Test 4', '2017-01-01', '9999-12-31' );
INSERT INTO cb_content VALUES (5, 'Test 5', '2017-01-01', '9999-12-31' );
INSERT INTO cb_content VALUES (6, 'Test 6', '2017-01-01', '9999-12-31' );
INSERT INTO cb_content VALUES (7, 'Test 7', '2017-01-01', '9999-12-31' );

--
-- Relation from NavItem2Content 
--
DROP TABLE IF EXISTS cb_navitemcontent;

CREATE TABLE IF NOT EXISTS cb_navitemcontent (
    navitem_id INTEGER,
    content_id INTEGER,
	begda DATE NOT NULL,
    endda DATE NOT NULL,
    FOREIGN KEY(navitem_id) REFERENCES cb_navitems(id) ON DELETE SET NULL,
    FOREIGN KEY(content_id) REFERENCES cb_content(id) ON DELETE SET NULL
);

INSERT INTO cb_navitemcontent VALUES (1, 1, '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitemcontent VALUES (2, 2, '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitemcontent VALUES (2, 3, '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitemcontent VALUES (3, 4, '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitemcontent VALUES (4, 6, '2017-01-01', '9999-12-31' );
INSERT INTO cb_navitemcontent VALUES (5, 7, '2017-01-01', '9999-12-31' );
