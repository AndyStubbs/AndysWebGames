"use strict";
var Command = ( function () {

	var m_commands, m_publicAPI, m_fileTypeMap, m_programs;

	m_publicAPI = {
		"AddCommand": AddCommand,
		"AddProgram": AddProgram,
		"GetPrograms": GetPrograms,
		"Execute": Execute,
		"GetFileTypes": GetFileTypes,
		"CreateProcess": CreateProcess,
		"GetDefaultIcon": GetDefaultIcon
	};

	m_fileTypeMap = {
		"script": {
			"cmd": "%data",
			"edit": "sys:save %file",
			"color": "#acacac",
			"icon": "url(data/img/icons/script.png)"
		},
		"picture": {
			"cmd": "sys:view %file",
			"edit": "sys:save %file",
			"color": "#acacac",
			"icon": "url(data/img/icons/photo.png)"
		},
		"link": {
			"cmd": "sys:link %data",
			"edit": "sys:save %file",
			"color": "#acacac",
			"icon": "url(data/img/icons/www-link.png)"
		},
		"folder": {
			"cmd": "sys:folder %file",
			"edit": "sys:save %file",
			"color": "#D4D40C", 
			"icon": "url(data/img/icons/folder.png)"
		},
		"text": {
			"cmd": "start:notepad %file",
			"edit": "start:notepad %file",
			"color": "#acacac",
			"icon": "url(data/img/icons/text-file.png)"
		},
		"video": {
			"cmd": "sys:watch %file",
			"edit": "sys:save %file",
			"color": "#acacac",
			"icon": "url(data/img/icons/video.png)"
		},
		"data": {
			"cmd": "sys:save %file",
			"edit": "sys:save %file",
			"color": "#acacac",
			"icon": "url(data/img/icons/data-file.png)"
		}
	};

	m_commands = {
		"dir": listDirectory,
		"ls": listDirectory,
		"cd": changeDirectory,
		"cls": clearScreen,
		"copy": copyFileCommand,
		"move": moveFileCommand,
		"delete": deleteFile,
		"del": deleteFile,
		"edit": editFile,
		"echo": echoCommand,
		"type": typeCommand,
		"cat": typeCommand,
		"help": helpCommand
	};

	m_programs = {};

	return m_publicAPI;

	function AddCommand( name, command ) {
		m_commands[ "sys:" + name ] = command;
	}

	function AddProgram( commandName, title, program, icon, description ) {
		m_commands[ "start:" + commandName ] = program;
		m_programs[ commandName ] = {
			"title": title,
			"icon": icon,
			"description": description,
			"start": program
		};
	}

	function GetPrograms() {
		var i, programs;
		programs = [];
		for( i in m_programs ) {
			programs.push( {
				"command": i,
				"title": m_programs[ i ].title,
				"icon": m_programs[ i ].icon,
				"description": m_programs[ i ].description
			} );
		}
		return programs;
	}

	function Execute( file, commandString ) {
		var process, commands, i, command;

		if( commandString === undefined ) {
			commandString = m_fileTypeMap[ file.type ].cmd;
		}

		// Replace %data with file data
		commandString = commandString.replace( /\%data/gi, file.data );

		// Replace %file with file name
		commandString = commandString.replace( /\%file/gi, "\"" + file.path + "\"" );

		process = CreateProcess( file );

		commands = commandString.split( "\n" );
		for( i = 0; i < commands.length; i++ ) {
			command = commands[ i ].trim();
			if( command !== "" ) {
				process.run( command );
			}
		}
	}

	function CreateProcess( file, useFileAsFolder ) {
		var folder, process;

		// Assign execution path for process
		if( useFileAsFolder ) {
			folder = file;
		} else if( file.parent ) {
			folder = file.parent;
		} else {
			Util.log( "Error: invalid file for process." );
			return false;
		}

		process = {
			"getPath": getPath,
			"setPath": setPath,
			"getFile": getFile,
			"run": run,
			"writeFile": writeFile,
			"moveFile": moveFile,
			"copyFile": copyFile
		};

		return process;

		function getPath() {
			return folder.path;
		}

		function getFile( path, allowWildcards ) {
			var parts, i, part, files, j, fileFound, searchFile, results;

			if( allowWildcards ) {
				results = [];
			}

			searchFile = folder;

			// Remove quotes from path
			path = path.replace( /\"/g, "" );

			// If filename starts with / then search from root
			if( path.charAt( 0 ) === "/" ) {
				searchFile = FileSystem.getFile( "/" );
			}

			// Split the slashes
			parts = path.split( /\//g );

			// Loop through all the parts of the path
			for( i = 0; i < parts.length; i++ ) {
				part = parts[ i ];
				if( part === "" ) {
					continue;
				}

				if( part === "." && i < parts.length - 1 ) {
					continue;
				}

				// .. represents go back
				if( part === ".." ) {
					if( ! searchFile.parent ) {
						Util.log( "Invalid path \"" + path + "\"." );
						return false;
					}
					searchFile = searchFile.parent;
					if( allowWildcards && i === parts.length - 1 ) {
						fileFound = true;
						results.push( searchFile );
					}
				} else {

					// Find the file inside a folder
					files = searchFile.files;
					fileFound = false;
					results = [];

					// Search for wildcards - Only on file part
					if( allowWildcards && i === parts.length - 1 ) {
						if( part === "." ) {
							fileFound = true;
							results.push( searchFile );
							break;
						}
						for( j = 0; j < files.length; j++ ) {
							if( files[ j ].name === part ) {
								results.push( files[ j ] );
								fileFound = true;
							}
							// Wildcard searches
							else {
								if( Util.matchWildcard( files[ j ].name, part ) ) {
									results.push( files[ j ] );
									fileFound = true;
								}
							}
						}
					}
					// Search for exact name
					else {
						if( part === "." ) {
							fileFound = true;
							break;
						}
						for( j = 0; j < files.length; j++ ) {
							if( files[ j ].name === part ) {
								fileFound = true;
								searchFile = files[ j ];
								break;
							}
						}
					}

					if( ! fileFound ) {
						Util.log( "Invalid path \"" + path + "\"." );
						return false;
					}
				}
			}
			if( allowWildcards ) {
				return results;
			}
			return searchFile;
		}

		function setPath( path ) {
			var newFolder;
			newFolder = getFile( path );
			if( ! newFolder ) {
				return false;
			}
			if( newFolder.isFolder ) {
				folder = newFolder;
			} else {
				Util.log( path + " is not a folder." );
				return false;
			}
			return true;
		}

		function run( commandString ) {
			var command, tokens, files, i;

			tokens = commandString.match( /(?:[^\s"]+|"[^"]*")+/g );

			if( ! tokens ) {
				return false;
			}

			if( tokens.length > 0 ) {

				// Get the command from token list
				command = tokens[ 0 ];

				// First look for command
				if( m_commands[ tokens[ 0 ] ] ) {
					return m_commands[ tokens[ 0 ] ]( tokens, process );
				}

				// Second execute any local files
				files = folder.files;
				for( i = 0; i < files.length; i++ ) {
					if(
						files[ i ].name === command ||
						files[ i ].name === commandString ||
						files[ i ].name === "/" + commandString
					) {
						return Execute( files[ i ] );
					}
				}

				Util.log( "Invalid command or file \"" + command + "\"." );
				return false;
			} else {
				Util.log( "Invalid command or file." );
				return false;
			}
		}

		function parseName( name ) {
			var path;

			name = name.replace( /\"/g, "" );

			// If the name includes a path then seperate the path from the name
			if( name.indexOf( "/" ) > -1 ) {
				path = name.substring( 0, name.lastIndexOf( "/" ) );
				name = name.substring( name.lastIndexOf( "/" ) + 1 )
				if( path === "" ) {
					path = "/";
				}
			} else {
				path = ".";
			}
			return {
				"name": name,
				"path": path
			};

		}

		function writeFile( name, filetype, data, icon, overwrite ) {
			var update, path, folder;

			update = parseName( name );
			name = update.name;
			path = update.path;

			folder = process.getFile( path );

			// Make sure the folder is correct
			if( ! folder ) {
				return false;
			}

			// Validate file type
			if( ! filetype || ! m_fileTypeMap[ filetype ] ) {
				Util.log( "Error: invalid file type." );
				return false;
			}

			// Pick a default filetype
			if( ! icon || icon === "" ) {
				icon = m_fileTypeMap[ filetype ].icon;
			}

			return FileSystem.CreateNewFile( folder, name, filetype, data, icon, overwrite );
		}

		function processFile( oldfile, name, index, action ) {
			var update, path, folder;

			update = parseName( name );
			name = update.name;
			path = update.path;

			// Find path using local file directory parsing
			folder = process.getFile( path );

			// Make sure the folder is correct
			if( ! folder ) {
				return false;
			}

			// Name should be full path name
			if( name === "." ) {
				name = folder.path;
			} else if ( name === ".." ) {
				name = folder.parent.path;
			} else if( folder.path === "/" ) {
				name = "/" + name;
			} else {
				name = folder.path + "/" + name;
			}
			return action( oldfile.path, name, false, index );
		}

		function moveFile( oldfile, name, index ) {
			return processFile( oldfile, name, index, FileSystem.moveFile );
		}

		function copyFile( oldfile, name, index ) {
			return processFile( oldfile, name, index, FileSystem.copyFile );
		}

	}

	function listDirectory( params, process ) {
		var files, i, msg, filename, maxLength, dataStr;

		maxLength = 25;
		files = FileSystem.getFolder( process.getPath() );
		msg = "";
		for( i = 0; i < files.length; i++ ) {
			filename = files[ i ].name;
			if( filename.length > maxLength ) {
				filename = filename.substring( 0, maxLength - 1 ) + "~";
			}
			dataStr = "class='click-line' data-path='" + files[ i ].path + "'";
			if( m_fileTypeMap[ files[ i ].type ] ) {
				msg += "<a " + dataStr + "style='color: " +
					m_fileTypeMap[ files[ i ].type ].color + "'>";
			} else {
				msg += "<a " + datastr + ">";
			}
			msg += filename + "</a>" + qbs.util.padR( " ", ( maxLength + 1 ) - filename.length ) +
				files[ i ].type;
			if( i !== files.length - 1 ) {
				msg += "\n";
			}
		}
		Util.log( msg );
		return true;
	}

	function changeDirectory( params, process ) {
		var path;

		if( params.length < 2 ) {
			Util.log( "Missing path." );
			return true;
		}

		if( params.length > 2 ) {
			path = "\"" + params.join( " " ).substring( 3 ) + "\"";
		} else {
			path = params[ 1 ];
		}

		return process.setPath( path );
	}

	function clearScreen( params, process ) {
		return true;
	}

	function prepMove( params, process ) {
		var files, folder, index;

		if( params.length < 2 ) {
			Util.log( "Missing filename." );
			return false;
		}
		if( params.length < 3 ) {
			Util.log( "Missing path." );
			return false;
		}

		files = process.getFile( params[ 1 ], true );
		if( ! Array.isArray( files ) || files.length < 1 ) {
			return false;
		}

		if( files.length > 1 ) {
			folder = process.getFile( params[ 2 ] );
			if( ! folder ) {
				return false;
			}

			if( ! folder.isFolder ) {
				Util.log( folder.path + " is not a folder." );
				return false;
			}
		} else {
			folder = null;
		}

		if( params.length > 3  && ! isNaN( parseInt( params[ 3 ] ) ) ) {
			index = parseInt( params[ 3 ] );
		}

		return {
			"files": files,
			"folder": folder,
			"index": index
		};
	}

	function copyFileCommand( params, process ) {
		var status, i;

		status = prepMove( params, process );

		if( ! status ) {
			return false;
		}

		// Single file copy
		if( status.folder === null ) {
			process.copyFile( status.files[ 0 ], params[ 2 ], status.index );
		}
		// Multiple file copy
		else {
			for( i = 0; i < status.files.length; i++ ) {
				FileSystem.copyFile(
					status.files[ i ].path, status.folder.path, false, status.index
				);
				if( status.index !== undefined ) {
					status.index += 1;
				}
			}
		}

		return true;
	}

	function moveFileCommand( params, process ) {
		var status, i;

		status = prepMove( params, process );

		if( ! status ) {
			return false;
		}

		// If folder is null then process single file move
		if( status.folder === null ) {
			process.moveFile( status.files[ 0 ], params[ 2 ], status.index );
		}
		// Multiple file move
		else {
			for( i = 0; i < status.files.length; i++ ) {
				FileSystem.moveFile(
					status.files[ i ].path, status.folder.path, false, status.index
				);
				if( status.index !== undefined ) {
					status.index += 1;
				}
			}
		}

		return true;
	}

	function deleteFile( params, process ) {
		var files, i;

		if( params.length < 2 ) {
			Util.log( "Missing filename." );
			return false;
		}

		files = process.getFile( params[ 1 ], true );
		if( ! Array.isArray( files ) || files.length < 1 ) {
			return false;
		}

		if( files.length === 0 ) {
			Util.log( params[ 1 ] + " file not found." );
			return false;
		}

		for( i = 0; i < files.length; i++ ) {
			if( files[ i ].isRoot ) {
				Util.log( "Unable to delete root file." );
			} else {
				FileSystem.deleteFile( files[ i ].path, true );
			}
		}
		Program.RefreshFolders();
		return true;
	}

	function editFile( params, process ) {
		var file;
		if( params.length < 2 ) {
			Util.log( "Missing filename." );
			return false;
		}

		file = process.getFile( params[ 1 ] );
		if( ! file ) {
			return false;
		}
		return Execute( file, m_fileTypeMap[ file.type ].edit );
	}

	function echoCommand( params, process ) {
		var msg, i;

		msg = "";
		if( params.length > 1 ) {
			for( i = 1; i < params.length; i++ ) {
				msg += params[ i ] + " ";
			}
			msg = msg.substring( 0, msg.length - 1 );
		}

		Util.log( msg );
		return true;
	}

	function typeCommand( params, process ) {
		var msg, i, file;

		msg = "";
		if( params.length > 1 ) {
			file = process.getFile( params[ 1 ] );
			if( ! file ) {
				return false;
			}
			msg = file.data;
		}

		if( msg !== "" ) {
			Util.log( msg );
		}
		return true;
	}

	function helpCommand( params, process ) {
		var commands, pathMsg, pathMsg2, wildMsg, quoteMsg, i, msg, command;

		pathMsg = "" +
			"<br />Path Examples: <br />" +
			"&nbsp;&nbsp; /folder/subfolder/file<br />" +
			"&nbsp;&nbsp; subfolder/file<br />" +
			"<br />Path Options: <br />" +
			"&nbsp;&nbsp; .. - Parent Directory<br />" +
			"&nbsp;&nbsp; . - Current Directory<br />" +
			"&nbsp;&nbsp; /folder - Full path.<br />" +
			"&nbsp;&nbsp; folder - Relative path.<br />" +
			"<br />Use quotes around paths that contain spaces.";

		pathMsg2 = "" +
			"<br />type \"help path\" for help on paths.";

		commands = {
			"cd": [
				"Changes the current directory.",
				"<br />cd [path]",
				pathMsg2
			],
			"cls": [
				"Clears the screen.",
				"<br />cls"
			],
			"copy": [
				"Copies a file or files to another directory.",
				"<br />copy [path-source] [path-destination]",
				"* - inside path for wildcard (source files only)",
				pathMsg2
			],
			"delete": [
				"Deletes a file(s)/folder(s).",
				"<br />delete [path]",
				"del [path]",
				pathMsg2
			 ],
			"dir": [
				"List all files and folders in a directory.",
				"<br />dir",
				"ls"
			],
			"move": [
				"Moves a file or files to another directory.",
				"<br />move [path-source] [path-destination]",
				"* - inside path for wildcard (source files only)",
				pathMsg2
			],
			"echo": [
				"Echo's text after the command.",
				"<br />echo [text]"
			],
			"edit": [
				"Edits the file.",
				"<br />edit [path]",
				pathMsg2
			],
			"help": [
				"Lists all commands or provides command details.",
				"<br />help",
				"help [command]"
			],
			"path": [
				"Enter a path to a file or folder to open/run it.",
				pathMsg
			],
			"type": [
				"Prints content of a file.",
				"<br />type [path]",
				pathMsg2
			]
		};

		msg = "";
		if( params.length < 2 ) {
			for( i in commands ) {
				msg += qbs.util.padR( i, 8 ).replace( / /g, "&nbsp;" ) +
					commands[ i ][ 0 ] + "<br />";
			}
			msg = msg.substr( 0, msg.length - 6 );
		} else {
			command = params[ 1 ];
			commands[ "ls" ] = commands[ "dir" ];
			commands[ "del" ] = commands[ "delete" ];
			commands[ "cat" ] = commands[ "type" ];

			if( ! commands[ command ] ) {
				Util.log( "Command: " + command + " not found. " );
				return true;
			}
			for( i = 0; i < commands[ command ].length; i++ ) {
				msg += commands[ command ][ i ];
				if( i < commands[ command ].length - 1 ) {
					msg += "<br />";
				}
			}
		}
		Util.log( msg );
		return true;
	}

	function GetFileTypes() {
		var fileTypes, i;
		fileTypes = [];
		for( i in m_fileTypeMap ) {
			fileTypes.push( i );
		}
		return fileTypes;
	}

	function GetDefaultIcon( filetype ) {
		if( m_fileTypeMap[ filetype ] ) {
			return m_fileTypeMap[ filetype ].icon;
		} else {
			Util.log( "Error: Invalid filetype " + filetype + "." );
			return false;
		}
	}

} )();
