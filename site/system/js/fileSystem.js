"use strict";
var FileSystem = ( function () {

var m_files, m_filesCache, m_publicAPI, m_lastFileId, m_tracker, m_data, m_settings, m_bigData,
	m_fileSaveDelay, m_fileSaveTimeout, m_isReset;

m_fileSaveDelay = 1000;
m_lastFileId = 0;
m_filesCache = {};
m_isReset = false;

m_publicAPI = {
	"Init": init,
	"getFolder": getFolder,
	"getFile": getFile,
	"moveFile": moveFile,
	"copyFile": copyFile,
	"canMoveFile": canMoveFile,
	"deleteFile": deleteFile,
	"CreateNewFile": CreateNewFile,
	"GetDataFileLocations": GetDataFileLocations,
	"GetDataFiles": GetDataFiles,
	"FindDataFile": FindDataFile,
	"CreateDataFile": CreateDataFile,
	"DeleteBigDataFile": DeleteBigDataFile,
	"GetSettings": GetSettings,
	"UpdateSettings": UpdateSettings,
	"ResetFileSystem": ResetFileSystem,
	"SaveWorkspace": SaveWorkspace,
	"LoadWorkspace": LoadWorkspace
};

m_data = {
	"Icons": [
		"data/img/icons/3d_textures.png",
		"data/img/icons/about.png",
		"data/img/icons/battleship.png",
		"data/img/icons/bites.png",
		"data/img/icons/blocks.png",
		"data/img/icons/build-stack.png",
		"data/img/icons/chess.png",
		"data/img/icons/console.png",
		"data/img/icons/data-file.png",
		"data/img/icons/dialog.png",
		"data/img/icons/flag.png",
		"data/img/icons/folder.png",
		"data/img/icons/help.png",
		"data/img/icons/hexland.png",
		"data/img/icons/illusion.png",
		"data/img/icons/intel.png",
		"data/img/icons/island.png",
		"data/img/icons/jetman.png",
		"data/img/icons/land.png",
		"data/img/icons/mandelbrot.png",
		"data/img/icons/maze_up.png",
		"data/img/icons/notebook.png",
		"data/img/icons/pacman.png",
		"data/img/icons/parallax.png",
		"data/img/icons/photo.png",
		"data/img/icons/pixel-editor.png",
		"data/img/icons/pirate.png",
		"data/img/icons/planets_small.png",
		"data/img/sys/save_disk.png",
		"data/img/sys/save_disk2.png",
		"data/img/icons/script.png",
		"data/img/icons/snake.png",
		"data/img/icons/space_ship.png",
		"data/img/icons/space_ship2.png",
		"data/img/icons/star.png",
		"data/img/icons/to-remember.png",
		"data/img/icons/text-file.png",
		"data/img/icons/tiger.png",
		"data/img/icons/warrior.png",
		"data/img/icons/wind.png",
		"data/img/icons/www-link.png",
		"data/img/icons/video.png",
		"data/img/icons/videos.png",
	],
	"Backgrounds": [
		"data/img/backgrounds/Almourol.jpg",
		"data/img/backgrounds/awg.png",
		"data/img/backgrounds/background1.png",
		"data/img/backgrounds/background2.png",
		"data/img/backgrounds/background3.png",
		"data/img/backgrounds/background4.png",
		"data/img/backgrounds/background5.png",
		"data/img/backgrounds/background6.png",
		"data/img/backgrounds/background7.png",
		"data/img/backgrounds/background8.png",
		"data/img/backgrounds/background9.png",
		"data/img/backgrounds/background10.png",
		"data/img/backgrounds/background11.png",
		"data/img/backgrounds/castle.png",
		"data/img/backgrounds/crater_lake.png",
		"data/img/backgrounds/Castles_of_Leinster.jpg",
		"data/img/backgrounds/dolomites-mountains-italy-alpine.jpg",
		"data/img/backgrounds/Evening_shades.jpg",
		"data/img/backgrounds/Falaise_chateau.jpg",
		"data/img/backgrounds/Farmland_Damme.jpg",
		"data/img/backgrounds/Grand_Canyon.jpg",
		"data/img/backgrounds/HimejiCastle.jpg",
		"data/img/backgrounds/honey-comb.png",
		"data/img/backgrounds/Iowa_farmland.jpg",
		"data/img/backgrounds/Kel_Taobut.jpg",
		"data/img/backgrounds/Korengal_Valley.jpg",
		"data/img/backgrounds/Landscape-Walters.jpg",
		"data/img/backgrounds/mountains-italy-alpine.jpg",
		"data/img/backgrounds/Nigde_Turkey.jpg",
		"data/img/backgrounds/ocean_passage.jpg",
		"data/img/backgrounds/Prince_Yongrong_Landscape_1779.jpg",
		"data/img/backgrounds/red-brick.png",
		"data/img/backgrounds/rivets.png",
		"data/img/backgrounds/rocky-mountains.jpg"
	],
	"Files": [
	],
	"Uploads": [
	]
};

m_settings = {
	"background": {
		"style": "Solid Color",
		"color": "#55A8A9",
		"image": "",
		"opacity": 1,
		"folderColor": "#EEEEEE",
		"headerColor": "#2700A8"
	},
	"icons": {
		"color": "#000000",
		"highColor": "#C2E673"
	}
};

m_bigData = {};

return m_publicAPI;

function init() {

	var data, oldUrl, img, bigDataRequests, bigDataComplete;
	
	data = JSON.parse( localStorage.getItem( "filesystem" ) );

	if( data === null ) {
		$.getJSON( "system/js/files.json", function( data ) {
			loadFileSystem( data );
			Program.Start( true );
		} ).fail( function( jqxhr, textStatus, error ) {
			var err = textStatus + ", " + error;
			Util.log( "Failed to load filesystem: " + err );
		} );
	} else {
		m_settings = data.m_settings;
		m_bigData = data.m_bigData;

		if( ! $.isEmptyObject( m_bigData ) ) {
			// Create new URL's for the big data objects
			bigDataRequests = 0;
			bigDataComplete = 0;
			for( oldUrl in m_bigData ) {
				img = new Image();
				img.src = m_bigData[ oldUrl ];

				// Delete the old reference
				delete m_bigData[ oldUrl ];

				// Update the URL
				bigDataRequests += 1;
				updateBigDataUrl( oldUrl, img );
			}
		} else {
			loadFileSystem( data.files );
			Program.Start();
		}
	}

	// Before closing save your filesystem
	window.addEventListener( "beforeunload", function () {
		if( ! m_isReset ) {
			saveFileSystemNow();
		}
	} );

	function updateBigDataUrl( oldUrl, img ) {
		img.onload = function () {
			var canvas, context;
			canvas = document.createElement( "canvas" );
			canvas.width = img.width;
			canvas.height = img.height;
			context = canvas.getContext( "2d" );
			context.drawImage( img, 0, 0, canvas.width, canvas.height );
			CreateDataFile( canvas, function ( newUrl ) {
				var i;
				for( i in data.files ) {
					if( data.files[ i ].data == null ) {
						data.files[ i ].data = "";
					}
					if( data.files[ i ].data.indexOf( oldUrl ) > -1 ) {
						data.files[ i ].data = data.files[ i ].data.replace( oldUrl, newUrl );
					}
				}
				if( m_settings.background.image === oldUrl ) {
					m_settings.background.image = newUrl;
				}
				bigDataComplete += 1;
				if( bigDataComplete === bigDataRequests ) {
					loadFileSystem( data.files );
					Program.Start();
				}
			} );
		}
	}
}

function DeleteBigDataFile( src ) {
	var i;

	for( i in m_filesCache ) {
		if( m_filesCache[ i ].data.indexOf( src ) > -1 ) {
			m_filesCache[ i ].data = m_filesCache[ i ].data.replace( src, "" );
		}
	}
	for( i = 0; i < m_data.Uploads.length; i++ ) {
		if( m_data.Uploads[ i ] === src ) {
			m_data.Uploads.splice( i, 1 );
			break;
		}
	}
	if( m_settings.background.image === src ) {
		m_settings.background.image = "";
	}
	delete m_bigData[ src ];
	URL.revokeObjectURL( src );
	saveFileSystem();
	Program.RefreshFolders();
}

function ResetFileSystem() {
	localStorage.removeItem( "filesystem" );
	m_isReset = true;
	window.location.reload();
}

function loadFileSystem( data ) {
	var filename;

	// Create the root directory
	m_files = createFile( {
		"name": "/",
		"isFolder": true,
		"type": "folder",
		"files": [],
		"path": "/",
		"isRoot": true
	} );

	for( filename in data ) {
		createFileFromPath( filename, data[ filename ] );
	}
}

function createFileFromPath( filePath, fileData ) {
	var currentFolder, parts, name, i, temp, path;

	if( typeof filePath !== "string" ) {
		return "Invalid Filename";
	}

	fileData.path = filePath;
	currentFolder = m_files;
	path = "";

	// Create the folders
	parts = filePath.split( "/" );
	for( i = 0; i < parts.length; i++ ) {

		if( parts[ i ] === "" ) {
			continue;
		}
	
		name = parts[ i ];
		path += "/" + name;

		// Check if part is a folderName
		if( i !== parts.length - 1 ) {

			// If it's a new folder then create it
			if( ! getFileFromFolder( name, currentFolder ) ) {

				// Create the folder file
				temp = createFile( {
					"name": name,
					"type": "folder",
					"icon": "url(data/img/icons/folder.png)",
					"files": [],
					"path": path,
					"isFolder": true,
					"parent": currentFolder
				} );
				currentFolder.files.push( temp );
				currentFolder = temp;

			} else {
				currentFolder = getFileFromFolder( name, currentFolder );
			}

		} else {

			// Set the file name part to the file data
			fileData.name = name;

		}
	}

	// Create the file
	fileData.parent = currentFolder;
	currentFolder.files.push( createFile( fileData ) );
}

function getFileFromFolder( filename, folder ) {
	var i;
	for( i = 0; i < folder.files.length; i++ ) {
		if( folder.files[ i ].name === filename ) {
			return folder.files[ i ];
		}
	}
	return false;
}

function createFile( fileData ) {
	var newFile;

	m_lastFileId += 1;

	if( ! fileData.data ) {
		fileData.data = "";
	}

	if( fileData.type === "folder" ) {
		fileData.files = [];
		fileData.isFolder = true;
	}

	newFile = {
		"id": m_lastFileId,
		"name": fileData.name,
		"type": fileData.type,
		"created": ( new Date() ).getTime(),
		"modified": ( new Date() ).getTime(),
		"path": fileData.path,
		"icon": fileData.icon,
		"isFolder": !! fileData.isFolder,
		"files": fileData.files,
		"parent": fileData.parent,
		"data": fileData.data,
		"isRoot": fileData.isRoot
	};

	m_filesCache[ newFile.id ] = newFile;
	m_filesCache[ newFile.path ] = newFile;

	if( fileData.type === "picture" ) {
		m_data[ "Files" ].push( fileData.data );
	}
	return newFile;
}

function canMoveFile( filePath, folderPath, isReorder, isCopy ) {
	var fileData, folderData, i, temp, name;

	fileData = getFile( filePath );
	folderData = getFile( folderPath, true );

	// If the folder is not found or if it's not a folder then use the last part as name
	if( ! folderData || ! folderData.isFolder ) {
		name = folderPath.substring( folderPath.lastIndexOf( "/" ) + 1 );
		folderPath = folderPath.substring( 0, folderPath.lastIndexOf( "/" ) );
		if( folderPath === "" ) {
			folderPath = "/";
		}
		folderData = getFile( folderPath );
	} else {
		name = fileData.name;
	}

	// Must have fileData and a proper folder data to continue
	if( ! fileData || ! folderData || ! folderData.isFolder ) {
		return false;
	}

	// Check if a file of the same name exists in the folder
	for( i = 0; i < folderData.files.length; i++ ) {
		if( isReorder && ! isCopy ) {
			if( folderData.files[ i ].name === name && folderData.files[ i ] !== fileData ) {
				Util.log(
					"Cannot move " + name + ". Name is already used in " +
					folderData.path + "."
				);
				return false;
			}
		} else {
			if( folderData.files[ i ].name === name ) {
				Util.log(
					"Cannot move " + name + ". Name is already used in " +
					folderData.path + "."
				);
				return false;
			}
		}
	}

	// If the file is not a folder then we are good
	if( ! fileData.isFolder ) {
		return true;
	}

	// if( filePath === folderPath && isReorder ) {
	// 	return true;
	// }

	// Check for circular reference in folder
	temp = folderData;
	while( temp ) {
		if( temp === fileData ) {
			Util.log(
				"Cannot move " + temp.path + " into " + fileData.path + ". (circular reference)"
			);
			return false;
		}
		temp = temp.parent;
	}

	return true;
}

function moveFile( filePath, folderPath, skipFolderUi, index ) {
	var fileData, folderData, msg, name, i, isReorder;

	fileData = getFile( filePath );
	index = parseInt( index );

	if( fileData.parent.path === folderPath && ! isNaN( index ) ) {
		isReorder = true;
	}

	if( ! canMoveFile( filePath, folderPath, isReorder, false ) ) {
		return false;
	}

	if( isReorder ) {
		folderData = fileData.parent;
	} else {
		folderData = getFile( folderPath, true );
	}

	// If the folder is not found or if it's not a folder then use the last part as name
	if( ! folderData || ! folderData.isFolder ) {
		name = folderPath.substring( folderPath.lastIndexOf( "/" ) + 1 );
		folderPath = folderPath.substring( 0, folderPath.lastIndexOf( "/" ) );
		if( folderPath === "" ) {
			folderPath = "/";
		}
		folderData = getFile( folderPath );
	}

	// Must have fileData and a proper folder data to continue
	if( ! fileData || ! folderData || ! folderData.isFolder ) {
		return false;
	}

	// If renaming make sure index is the same
	if( folderData === fileData.parent && isNaN( index ) ) {
		for( i = 0; i < folderData.files.length; i++ ) {
			if( folderData.files[ i ] === fileData ) {
				index = i;
				break;
			}
		}
	}

	// Delete the file from the previous lookup data
	delete m_filesCache[ fileData.path ];

	// Remove the file from the previous folder
	removeFileFromFolder( fileData, fileData.parent );

	// Rename file if provided
	if( name && typeof name === "string" ) {
		fileData.name = name;
	}

	// Log the filename
	msg = "Moving File: " + fileData.path;

	// Upate the file's new path
	if( folderData.path === "/" ) {
		fileData.path = "/" + fileData.name;
	} else {
		fileData.path = folderData.path + "/" + fileData.name;
	}

	// Log the destination
	msg += " To: " + fileData.path

	fileData.parent = folderData;

	// Update the file lookup table;
	m_filesCache[ fileData.path ] = fileData;

	// Log the index
	if( ! isNaN( index ) ) {
		msg += " Index: " + index;
	}
	Util.log( msg );

	// Add the file into the new folder
	if( isNaN( index ) || index >= folderData.files.length || index < 0 ) {
		folderData.files.push( fileData );
	} else {
		folderData.files.splice( index, 0, fileData );
	}

	// Recursivley update the paths for all files inside a folder
	m_tracker = 0;
	repathFolder( fileData );

	Program.RefreshFolders( skipFolderUi );

	saveFileSystem();
	return true;
}

function copyFile( filePath, folderPath, skipFolderUi, index ) {
	var fileData, folderData, newFile, i, msg, name, path, isReorder;

	index = parseInt( index );

	if( filePath === folderPath && ! isNaN( index ) ) {
		isReorder = true;
	}

	if( ! canMoveFile( filePath, folderPath, ! isNaN( index ), true ) ) {
		Util.log( "Unable to copy file " + filePath + " to " + folderPath );
		return false;
	}

	fileData = getFile( filePath );
	if( isReorder ) {
		folderData = fileData.parent;
	} else {
		folderData = getFile( folderPath, true );
	}

	// If the folder is not found or if it's not a folder then use the last part as name
	if( ! folderData || ! folderData.isFolder ) {
		name = folderPath.substring( folderPath.lastIndexOf( "/" ) + 1 );
		folderPath = folderPath.substring( 0, folderPath.lastIndexOf( "/" ) );
		if( folderPath === "" ) {
			folderPath = "/";
		}
		folderData = getFile( folderPath );
	} else {
		name = fileData.name;
	}

	// Must have fileData and a proper folder data to continue
	if( ! fileData || ! folderData || ! folderData.isFolder ) {
		return false;
	}

	if( folderData.path === "/" ) {
		path = folderData.path + name;
	} else {
		path = folderData.path + "/" + name;
	}
	msg = "Copying File: " + fileData.path + " To: " + path;
	if( ! isNaN( index ) ) {
		msg += " Index: " + index;
	}
	Util.log( msg );

	newFile = createFile( {
		"name": name,
		"type": fileData.type,
		"path": path,
		"icon": fileData.icon,
		"isFolder": !! fileData.isFolder,
		"files": [],
		"parent": folderData,
		"data": fileData.data,
		"isRoot": fileData.isRoot
	} );

	// Add the file into the new folder
	if( isNaN( index ) || index >= folderData.files.length || index < 0 ) {
		folderData.files.push( newFile );
	} else {
		folderData.files.splice( index, 0, newFile );
	}

	// If it's a folder then copy all of the files inside it to the new path
	if( newFile.isFolder ) {
		for( i = 0; i < fileData.files.length; i++ ) {
			copyFile( fileData.files[ i ].path, newFile.path );
		}
	}

	Program.RefreshFolders( skipFolderUi );

	saveFileSystem();
	return true;
}

function repathFolder( folder ) {
	var i, file, oldPath;
	m_tracker += 1;
	if( m_tracker > 1000 ) {
		Util.log( "Circular path found!" );
		debugger;
		return;
	}
	if( folder.files ) {
		for( i = 0; i < folder.files.length; i++ ) {
			file = folder.files[ i ];
			oldPath = file.path;
			file.path = folder.path + "/" + file.name;
			delete m_filesCache[ oldPath ];
			m_filesCache[ file.path ] = file;
			repathFolder( file );
		}
	}
}

function deleteFile( filename, skipRefresh ) {
	deleteFileRecursive( filename );

	if( ! skipRefresh ) {
		Program.RefreshFolders();
	}

	saveFileSystem();
}

function deleteFileRecursive( filename ) {
	var file, i, list, index;

	file = getFile( filename );

	// Recursively delete all files inside the folder
	if( file.isFolder && file.files ) {
		list = [];
		for( i = 0; i < file.files.length; i ++ ){
			list.push( file.files[ i ].path );
		}
		for( i = 0; i < list.length; i++ ) {
			deleteFileRecursive( list[ i ] );
		}
	}

	if( file.type === "picture" ) {
		index = m_data[ "Files" ].indexOf( file.data );
		if( index > -1 ) {
			m_data[ "Files" ].splice( index, 1 );
		}
	}
	Util.log( "Deleting file " + file.path );
	removeFileFromFolder( file, file.parent );
	delete m_filesCache[ file.id ];
	delete m_filesCache[ file.path ];
}

function removeFileFromFolder( file, folder ) {
	var i, files;

	files = folder.files;
	for( i = 0; i < files.length; i++ ) {
		if( files[ i ] === file ) {
			files.splice( i, 1 );
			folder.modified = ( new Date() ).getTime();
			break;
		}
	}
}

function parsePath( pathOrId ) {
	if( typeof pathOrId === "string" ) {
		return pathOrId.replace( /\"/g, "" );
	}
	return pathOrId;
}

function getFile( pathOrId, skipLogging ) {
	pathOrId = parsePath( pathOrId );

	if( m_filesCache[ pathOrId ] ) {
		return m_filesCache[ pathOrId ];
	}

	if( ! skipLogging ) {
		Util.log( "File " + pathOrId + " not found." );
	}
	return false;
}

function getFolder( pathOrId ) {
	if( ! m_filesCache[ parsePath( pathOrId ) ] ) {
		Util.log( "Cannot find folder " + pathOrId + "." );
		return false;
	}
	return getFile( pathOrId ).files;
}

function CreateNewFile( folder, name, filetype, data, icon, overwrite ) {
	var newFile, i, path, oldfile, fileFound;

	// Validate file name
	if( name.indexOf( "\"" ) > -1 ) {
		Util.log( "Error: file names cannot contain \"." );
		return false;
	}

	if( name.length < 1 ) {
		Util.log( "Error: filename cannot be blank." );
		return false;
	}

	if( name.indexOf( "/" ) > -1 ) {
		Util.log( "Error: file names cannot contain /." );
		return false;
	}

	if( typeof data !== "string" ) {
		Util.log( "Error: invalid data type." );
		return false;
	}

	// Make sure folder is a folder
	if( ! folder.isFolder || ! folder.files || ! Array.isArray( folder.files ) ) {
		Util.log( "Error: " + folder.path + " is not a folder." );
		return false;
	}

	// Check to make sure name is not in folder
	for( i = 0; i < folder.files.length; i++ ) {
		if( folder.files[ i ].name === name ) {
			if( overwrite ) {
				oldfile = folder.files[ i ];
				fileFound = true;
				break;
			} else {
				Util.log( "Error: Name " + name + " is already used in folder " + folder.name + "." );
				return false;
			} 
		}
	}

	if( overwrite && fileFound ) {
		oldfile.type = filetype;
		oldfile.icon = icon;
		oldfile.data = data;
		oldfile.modified = ( new Date() ).getTime();
	} else {

		// Is this the root path
		if( folder.path === "/" ) {
			path = "/" + name;
		} else {
			path = folder.path + "/" + name;
		}

		// Create the file
		newFile = createFile( {
			"name": name,
			"type": filetype,
			"path": path,
			"icon": icon,
			"isFolder": filetype === "folder",
			"files": [],
			"parent": folder,
			"data": data,
			"isRoot": false
		} );

		folder.files.push( newFile );

	}

	Program.RefreshFolders( false );

	saveFileSystem();
	return true;
}

function GetDataFileLocations() {
	var locations, loc;
	locations = [];
	for( loc in m_data ) {
		locations.push( loc );
	}
	return locations;
}

function GetDataFiles( loc ) {
	if( ! m_data[ loc ] ) {
		Util.log( "Error: Invalid data location " + loc + "." );
		return false;
	}
	return m_data[ loc ];
}

function FindDataFile( name ) {
	var loc, i;

	for( loc in m_data ) {
		for( i = 0; i < m_data[ loc ].length; i++ ) {
			if( m_data[ loc ][ i ] === name ) {
				return loc;
			}
		}
	}
	return false;
}

function CreateDataFile( canvas, callback ) {
	canvas.toBlob( function ( blob ) {
		var objUrl;

		objUrl = URL.createObjectURL( blob );
		m_data.Uploads.push( objUrl );
		m_bigData[ objUrl ] = canvas.toDataURL();

		if( qbs.util.isFunction( callback ) ) {
			callback( objUrl );
		}
		saveFileSystem();
	} );
}

function GetSettings() {
	return m_settings;
}

function UpdateSettings( settings ) {
	if( settings.background ) {
		if( settings.background.style ) {
			m_settings.background.style = settings.background.style;
		}
		if( settings.background.color ) {
			m_settings.background.color = settings.background.color;
		}
		if( settings.background.image ) {
			m_settings.background.image = settings.background.image;
		}
		if( settings.background.opacity ) {
			m_settings.background.opacity = settings.background.opacity;
		}
		if( settings.background.headerColor ) {
			m_settings.background.headerColor = settings.background.headerColor;
		}
		if( settings.background.folderColor ) {
			m_settings.background.folderColor = settings.background.folderColor;
		}
	}

	if( settings.icons ) {
		if( settings.icons.color ) {
			m_settings.icons.color = settings.icons.color;
		}
		if( settings.icons.highColor ) {
			m_settings.icons.highColor = settings.icons.highColor;
		}
	}

	saveFileSystem();
}

function saveFileSystem() {
	clearTimeout( m_fileSaveTimeout );
	m_fileSaveTimeout = setTimeout( saveFileSystemNow, m_fileSaveDelay );
}

function saveFileSystemNow() {
	var data;

	data = {
		"files": createFileData(),
		"m_settings": m_settings,
		"m_bigData": m_bigData
	};
	try {
		localStorage.setItem( "filesystem", JSON.stringify( data ) );
	} catch( ex ) {
		alert(
			"You have exceeded your local storage limit. You can delete some of your uploaded" +
			" images to free up more space.  I recommend uploading your large images to " +
			"other sites and link to them as files here.  You can still access them here as " +
			"links."
		);
		window.location.reload();
	}
}

function createFileData() {
	var data, folder;

	data = {};
	folder = m_filesCache[ "/" ];
	createFolderData( data, folder );

	return data;
}

function createFolderData( data, folder ) {
	var i;

	if( folder.files.length === 0 ) {
		data[ folder.path ] = {
			"type": "folder",
			"data": null,
			"icon": folder.icon
		};
	}

	for( i = 0; i < folder.files.length; i++ ) {
		if( folder.files[ i ].isFolder ) {
			createFolderData( data, folder.files[ i ] );
		} else {
			data[ folder.files[ i ].path ] = {
				"type": folder.files[ i ].type,
				"data": folder.files[ i ].data,
				"icon": folder.files[ i ].icon
			};
		}
	}
}

function SaveWorkspace() {
	var data, blob;

	data = {
		"files": createFileData(),
		"m_settings": m_settings,
		"m_bigData": m_bigData
	};

	blob = new Blob(
		[ JSON.stringify( data ) ],
		{ "type": "application/json" }
	);

	saveData( blob, "web-os.workspace" );
}

function LoadWorkspace( file ) {
	var blob;

	blob = new Blob( [ file ], { "type": "application/json" } );
	blob.text().then( function ( text ) {
		var data;

		try {
			data = JSON.parse( text );
			if( data.files && data.m_settings && data.m_bigData ) {
				localStorage.setItem( "filesystem", JSON.stringify( data ) );
				window.location.reload();
			}
		} catch( ex ) {
			console.log( ex );
		}
	} );
}

function saveData( blob, filename ) {
	var a;

	a = document.createElement( "a" );
	a.href = URL.createObjectURL( blob );
	a.download = filename;
	document.body.appendChild( a );
	a.click();
	a.parentElement.removeChild( a );
	URL.revokeObjectURL( a.href );
}

} )();
