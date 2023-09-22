
"use strict";

/* global FileSystem */
var ContextMenu = ( function () {

var publicAPI, m_$menu, m_$copyFile, m_isCut, m_$submenu, m_hoverTimeout, m_path;

m_hoverTimeout = false;
publicAPI = {
	"Open": Open,
	"Close": Close
};

return publicAPI;

function Open( e ) {

	var $clickLocation, isFolder, $window, windowOptions, menuPos, isHidden, hasItems;

	if( m_$menu ) {
		m_$menu.html( "" );
	} else {
		m_$menu = $( "<div class='contextmenu'>" );
		$( "#main" ).append( m_$menu );
		m_$menu.on( "mousemove", "div", function ( e ) {
			if( ! this.dataset.submenu && m_$submenu ) {
				if( ! m_hoverTimeout ) {
					m_hoverTimeout = setTimeout( function () {
						m_$submenu.hide();
						m_hoverTimeout = false;
					}, 500 );
				}
			} else if( this.dataset.submenu ) {
				addNewFileSubmenu( e );
			}
		} )
	}

	if( m_$submenu ) {
		m_$submenu.hide();
	}
	$( ".contextmenu" ).hide();

	$clickLocation = $( document.elementFromPoint( e.pageX, e.pageY ) );

	isFolder = false;
	isHidden = false;

	// Clicked on desktop
	if( $clickLocation[ 0 ].id === "main" ) {
		hasItems = true;
		isFolder = true;
		m_path = "/";
		addDesktopMenus( e );
	}
	// Clicked on an icon
	else if( $clickLocation.hasClass( "icon" ) ) {
		hasItems = true;
		addIconMenus( $clickLocation, e );
	}
	else if( $clickLocation.hasClass( "divTsIcon" ) ) {
		hasItems = true;
		addTaskbarMenus( $clickLocation, e );
	}
	// Clicked on a window
	else if( $clickLocation.closest( ".window" ).length > 0 ) {
		$window = $clickLocation.closest( ".window" );
		if( $window.length === 0 ) {
			e.preventDefault();
			return;
		}
		windowOptions = $window.data( "options" );
		m_path = FileSystem.getFile( windowOptions.id ).path;

		if( windowOptions.isFolder ) {
			isFolder = true;
			hasItems = true;
		} else {
			addApplicationMenus( $clickLocation, m_path, e );
		}
	} else {
		$clickLocation = $( "#main" );
		hasItems = true;
		isFolder = true;
		m_path = "/";
		addDesktopMenus( e );
	}

	if( isFolder ) {
		addFolderMenus( $clickLocation, m_path, e );
	}

	if( ! isHidden ) {
		menuPos = {
			"left": e.pageX,
			"top": e.pageY ,
			"width": m_$menu.width(),
			"height": m_$menu.height()
		};
		WindowFactory.SetRecommendedPos( menuPos, 10 );
		m_$menu.css( "left", menuPos.left );
		m_$menu.css( "top", menuPos.top );
		m_$menu.show();
	}

	if( hasItems ) {
		e.preventDefault();
	}
}

function addDesktopMenus( e ) {
	var $contextAction;

	$contextAction = $( "<div>Settings</div>" );
	$contextAction.on( "click", function () {
		Program.CreateSetBackgroundImageDialog( { "left": e.pageX, "top": e.pageY }, "" );
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );
}

function addFolderMenus( $clickLocation, path, e ) {

	var $contextAction;

	// Open Console
	$contextAction = $( "<div>Open Console</div>" );
	$contextAction.on( "click", function () {
		var tempFile = {
			"type": "script",
			"data": "start:console",
			"parent": FileSystem.getFile( path ),
			"path": ""
		};
		Command.Execute( tempFile );
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );

	// New File
	$contextAction = $( "<div data-submenu='true'>New File <span>&#8250;</span></div>" );
	$contextAction.on( "click", addNewFileSubmenu );
	//$contextAction.on( "mousemove", addNewFileSubmenu );
	m_$menu.append( $contextAction );

	// Paste File
	$contextAction = $( "<div>Paste File</div>" );
	if( m_$copyFile ) {
		$contextAction.on( "click", function () {
			var copyFile;
			if( m_$copyFile ) {
				copyFile = FileSystem.getFile( m_$copyFile.data( "options" ).id );
				if( FileSystem.canMoveFile( copyFile.path, path, false, true ) ) {
					if( m_isCut ) {
						FileSystem.moveFile( copyFile.path, path );
						m_$copyFile.removeClass( "icon-cut" );
						m_$copyFile = null;
					} else {
						FileSystem.copyFile( copyFile.path, path );
						m_$copyFile.removeClass( "icon-copy" );
						m_$copyFile = null;
					}
				} else {
					alert( "Cannot move " + copyFile.path + " into " + path );
				}
			} else {
				alert( "No file to copy" );
			}
			$( ".contextmenu" ).hide();
		} );
	} else if( ! m_$copyFile ) {
		$contextAction.addClass( "disabled-item" );
	}
	m_$menu.append( $contextAction );

	$contextAction = $( "<div>Cancel Cut/Copy</div>" );
	if( m_$copyFile ) {
		$contextAction.on( "click", function () {
			if( m_$copyFile ) {
				m_$copyFile.removeClass( "icon-copy" );
				m_$copyFile.removeClass( "icon-cut" );
				m_$copyFile = null;
			}
			$( ".contextmenu" ).hide();
		} );
	} else if( ! m_$copyFile ) {
		$contextAction.addClass( "disabled-item" );
	}
	m_$menu.append( $contextAction );

	// Import Image
	$contextAction = $( "<div>Import Image</div>" );
	$contextAction.on( "click", function () {
		FileImport.Start( path );
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );

}

function addNewFileSubmenu( e ) {
	var menuPos, $contextAction;

	clearTimeout( m_hoverTimeout );
	m_hoverTimeout = false;

	// Create the submenu
	if( ! m_$submenu ) {
		m_$submenu = $( "<div class='contextmenu'>" );
		$( "#main" ).append( m_$submenu );
		m_$submenu.on( "mousemove", function () {
			clearTimeout( m_hoverTimeout );
			m_hoverTimeout = false;
		} );
	} else {

		// Exit function if menu is already displayed
		if( m_$submenu[ 0 ].style.display !== "none" ) {
			return;
		}
		m_$submenu.html( "" );
	}

	// Update the submenu position
	menuPos = m_$menu.offset();
	menuPos.width = m_$menu.width();
	menuPos.height = m_$menu.height();

	// If hovering over a sub item then use parent as top position
	if( e.target.tagName === "SPAN" ) {
		menuPos.top = $( e.target.parentElement ).offset().top;
	} else {
		menuPos.top = $( e.target ).offset().top;
	}
	menuPos.left += menuPos.width;
	WindowFactory.SetRecommendedPos( menuPos, 10 );
	m_$submenu.css( "left", menuPos.left );
	m_$submenu.css( "top", menuPos.top );
	m_$submenu.show();

	// Folder File
	$contextAction = $( "<div>New Folder</div>" );
	$contextAction.on( "click", function () {
		var pos;

		pos = {
			"left": e.pageX - 200,
			"top": e.pageY - 10
		};
		Program.CreateFileDialog( m_path, "Folder", "folder", "", pos, "new" );
		$( ".contextmenu" ).hide();
	} );
	m_$submenu.append( $contextAction );

	// New Link
	$contextAction = $( "<div>New Link</div>" );
	$contextAction.on( "click", function () {
		var pos;

		pos = {
			"left": e.pageX - 200,
			"top": e.pageY - 10
		};
		Program.CreateFileDialog( m_path, "blank", "link", "https://", pos, "new" );
		$( ".contextmenu" ).hide();
	} );
	m_$submenu.append( $contextAction );

	// New Picture
	$contextAction = $( "<div>New Picture</div>" );
	$contextAction.on( "click", function () {
		var pos;

		pos = {
			"left": e.pageX - 200,
			"top": e.pageY - 10
		};
		Program.CreateFileDialog( m_path, "Picture", "picture", "", pos, "new" );
		$( ".contextmenu" ).hide();
	} );
	m_$submenu.append( $contextAction );

	// Add Program
	$contextAction = $( "<div>New Program</div>" );
	$contextAction.on( "click", function () {
		var pos, $dialog;

		pos = {
			"left": e.pageX - 200,
			"top": e.pageY - 10
		};
		$dialog = Program.CreateFileDialog( m_path, "program", "script", "", pos, "new" );
		setTimeout( function () {
			$dialog.find( ".data .select-program" ).trigger( "click" );
		}, 1 );

		$( ".contextmenu" ).hide();
	} );
	m_$submenu.append( $contextAction );

	// Text File
	$contextAction = $( "<div>New Text File</div>" );
	$contextAction.on( "click", function () {
		var pos;

		pos = {
			"left": e.pageX - 200,
			"top": e.pageY - 10
		};
		Program.CreateFileDialog( m_path, "empty", "text", "", pos, "new" );
		$( ".contextmenu" ).hide();
	} );
	m_$submenu.append( $contextAction );

	// New Video
	$contextAction = $( "<div>New Video</div>" );
	$contextAction.on( "click", function () {
		var pos;

		pos = {
			"left": e.pageX - 200,
			"top": e.pageY - 10
		};
		Program.CreateFileDialog( m_path, "Video", "video", "https://", pos, "new" );
		$( ".contextmenu" ).hide();
	} );
	m_$submenu.append( $contextAction );
}

function addIconMenus( $clickLocation, e ) {
	
	var $contextAction, file;

	$clickLocation.addClass( "icon-selected" );
	file = FileSystem.getFile( $clickLocation.data( "options" ).id );

	// Set as Background
	if( file.type === "picture" ) {
		$contextAction = $( "<div>Set as Background</div>" );
		$contextAction.on( "click", function () {
			Program.CreateSetBackgroundImageDialog(
				{ "left": e.pageX, "top": e.pageY }, file.data
			);
			$( ".contextmenu" ).hide();
		} );
		m_$menu.append( $contextAction );
	}

	// Open
	$contextAction = $( "<div>Open File</div>" );
	$contextAction.on( "click", function () {
		Command.Execute( file );
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );

	// Edit
	$contextAction = $( "<div>Edit File</div>" );
	$contextAction.on( "click", function () {
		var tempFile = {
			"type": "script",
			"data": "edit \"" + file.path + "\"",
			"parent": file.parent,
			"path": file.path
		};
		Command.Execute( tempFile );
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );

	// Copy
	$contextAction = $( "<div>Copy File</div>" );
	$contextAction.on( "click", function () {
		m_$copyFile = $clickLocation;
		m_$copyFile.addClass( "icon-copy" );
		m_isCut = false;
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );

	// Cut
	$contextAction = $( "<div>Cut File</div>" );
	$contextAction.on( "click", function () {
		$( ".icon-cut" ).removeClass( "icon-cut" );
		m_$copyFile = $clickLocation;
		m_$copyFile.addClass( "icon-cut" );
		m_isCut = true;
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );

	// Delete
	$contextAction = $( "<div>Delete File</div>" );
	$contextAction.on( "click", function () {
		FileSystem.deleteFile( file.path, false );
		$( ".contextmenu" ).hide();
	} );
	m_$menu.append( $contextAction );
}

function addTaskbarMenus() {

	var $contextAction;

	// Close Process
	$contextAction = $( "<div>Close Process</div>" );
	$contextAction.on( "click", function () {
		alert( "Close Process!" );
	} );
	m_$menu.append( $contextAction );

}

function addApplicationMenus( $clickLocation, path, e ) {

}

function Close() {
	if( m_$menu ) {
		$( ".contextmenu" ).hide();
	}
}

} )();
