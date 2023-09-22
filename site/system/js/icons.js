"use strict";

/* global FileSystem */
var IconFactory = ( function () {

var publicAPI, m_$selectedIcon, m_$iconPlaceHolder, m_$iconCancelPosition, m_$dragIcon,
	m_isDragging, m_mouse, m_$lastDropLocation, m_isAnimating, $m_mainOverlay;

m_mouse = {
	"x": -1,
	"y": -1
};

//Provides access to methods in the WindowsFactory
publicAPI = {
	"CreateIcon": CreateIcon,
	"Init": Init
};

return publicAPI;

function Init() {
	$( document ).on( "mousedown", ".icon", iconMouseDown );
	$( document ).on( "mousemove", iconMouseMove );
	$( document ).on( "mouseup", iconMouseUp );
	m_$iconPlaceHolder = $( "<div class='icon icon-placeholder'>" );
	m_$iconCancelPosition = $( "<div class='icon icon-cancel-position'>" );
	$m_mainOverlay = $( "#mainOverlay" );
}

function CreateIcon( $folderWindow, options, isLink ) {
	var $icon;

	if( isLink ) {
		$icon = $(
			"<div class='icon'>" +
				"<img src='data/img/sys/link.png' />" +
				"<span class='link'>" + options.name + "</span>" +
			"</div>"
		);
	} else {
		$icon = $(
			"<div class='icon'>" +
				"<span>" + options.name + "</span>" +
			"</div>"
		);
	}

	if( Util.isMobile() ) {
		$icon.on( "click", options.dblClick );
	} else {
		$icon.on( "dblclick", options.dblClick );
	}
	$icon.data( "options", options );

	//Set the icon image
	$icon.css( "background-image", options.image );

	if( $folderWindow[ 0 ] === $( "#main" )[ 0 ] ) {
		$folderWindow.append( $icon );
	} else {
		$folderWindow.find( ".windowBody" ).append( $icon );
	}
	
	return $icon;
}

function iconMouseDown( e ) {
	if( m_$selectedIcon ) {
		m_$selectedIcon.removeClass( "icon-selected" );
	}
	m_$selectedIcon = $( this );
	m_$selectedIcon.addClass( "icon-selected" );
	m_$dragIcon = m_$selectedIcon;
}

function iconMouseMove( e ) {
	if( m_$dragIcon && ! m_isAnimating ) {
		if( ! m_isDragging ) {
			startIconDrag( e );
		}
		dragIcon( e );
	}
	m_mouse.x = e.pageX;
	m_mouse.y = e.pageY;
}

function iconMouseUp( e ) {
	if( m_isDragging ) {
		stopDragging();
	} else {
		if( m_$selectedIcon ) {
			m_$selectedIcon.removeClass( "icon-selected" );
		}
	}

	m_$dragIcon = false;
	m_isDragging = false;
}

function startIconDrag( e ) {

	// An overlay image that prevents iframes from capturing events
	$m_mainOverlay.css( "zIndex", WindowFactory.GetZIndex() );
	$m_mainOverlay.show();

	// Clear the selected icon
	m_$selectedIcon = false;

	// Flag dragging
	m_isDragging = true;

	// Setup dragging icon
	m_$dragIcon.removeClass( "icon-selected" );
	m_$dragIcon.addClass( "icon-dragging" );
	m_$dragIcon.before( m_$iconCancelPosition );
	m_$dragIcon.before( m_$iconPlaceHolder );
	m_$dragIcon.css( "zIndex", WindowFactory.GetZIndex() + 1 );

	// Move the dragging icon onto the main body page
	$( "#main" ).append( m_$dragIcon );
	m_$dragIcon.css( "left", e.pageX - m_$dragIcon.width() / 2 );
	m_$dragIcon.css( "top", e.pageY - m_$dragIcon.height() / 2 );
}

function dragIcon( e ) {
	var size, newLeft, newTop, iconWidth, iconHeight;

	// Measure Objects
	size = Util.getWindowSize();
	iconWidth = m_$dragIcon.width();
	iconHeight = m_$dragIcon.height();

	newLeft = e.pageX - iconWidth / 2;
	newTop = e.pageY - iconHeight * 0.33;

	// Horizontal Constraints
	if( newLeft < 0 ) {
		newLeft = 0;
	}
	if( newLeft > size.width - iconWidth ) {
		newLeft = size.width - iconWidth;
	}

	// Vertical Constraints
	if( newTop < 0 ) {
		newTop = 0;
	}
	if( newTop > size.height - iconHeight ) {
		newTop = size.height - iconHeight;
	}

	//Set the new window position
	m_$dragIcon.css( "left", newLeft );
	m_$dragIcon.css( "top", newTop );

	movePlaceholder( e );
}

function movePlaceholder( e ) {
	var $dropLocation, dropIndex, $collection, placeHolderIndex;

	$m_mainOverlay.hide();
	m_$dragIcon.hide();
	$dropLocation = $( document.elementFromPoint( e.pageX, e.pageY ) );
	m_$dragIcon.show();
	$m_mainOverlay.show();

	// Skip if the drop location is the same element as last time
	if(
		$dropLocation.length === 0 ||
		( m_$lastDropLocation && m_$lastDropLocation[ 0 ] === $dropLocation[ 0 ] )
	) {
		return;
	}

	// If hovering over an icon
	if( $dropLocation.hasClass( "icon" ) && ! $dropLocation.hasClass( "icon-placeholder" ) ) {

		// If file can move into the folder
		if( verifyMovement ( m_$dragIcon, $dropLocation ) ) {

			// Clear the cursor
			m_$dragIcon.css( "cursor", "" );

			// If dropping in the same folder as placeholder
			if( $dropLocation.parent()[ 0 ] === m_$iconPlaceHolder.parent()[ 0 ] ) {

				// Calculate if the placeholder goes before or after the droplocation
				$collection = $dropLocation.parent().find( ".icon" );
				dropIndex = $collection.index( $dropLocation );
				placeHolderIndex = $collection.index( m_$iconPlaceHolder );

				if( placeHolderIndex > dropIndex ) {
					$dropLocation.before( m_$iconPlaceHolder );
				} else {
					$dropLocation.after( m_$iconPlaceHolder );
				}

			} else {
				$dropLocation.before( m_$iconPlaceHolder );
			}
		}
		// Movement is not allowed
		else {
			m_$iconCancelPosition.after( m_$iconPlaceHolder );
			m_$dragIcon.css( "cursor", "not-allowed" );
		}
	}
	// Hovering over a folder body or main body
	else if( $dropLocation.hasClass( "windowBody" ) || $dropLocation[ 0 ].id === "main" ) {

		// If file can move into the folder
		if( verifyMovement ( m_$dragIcon, $dropLocation ) ) {
			m_$dragIcon.css( "cursor", "" );
			$dropLocation.append( m_$iconPlaceHolder );
		}
		// Movement is not allowed
		else {
			m_$iconCancelPosition.after( m_$iconPlaceHolder );
			m_$dragIcon.css( "cursor", "not-allowed" );
		}
	}
	m_$lastDropLocation = $dropLocation;
}

function stopDragging() {
	var $dragIcon, placeHolderOffset, index, fileId, folderId, oldFolderId;

	$m_mainOverlay.hide();

	// Assign a local copy to use in timeout after global is destroyed
	$dragIcon = m_$dragIcon;

	// Get the index of the move location
	index = m_$iconPlaceHolder.parent().find( ".icon" ).index( m_$iconPlaceHolder );

	// Move the file in the file system
	fileId = parseInt( $dragIcon.data( "options" ).id );
	folderId = getWindowId( m_$iconPlaceHolder.parent() );
	FileSystem.moveFile(
		FileSystem.getFile( fileId ).path,
		FileSystem.getFile( folderId ).path, true, index
	);

	// Setup icon animation
	placeHolderOffset = m_$iconPlaceHolder.offset();
	$dragIcon.css( "transition-duration", "0.5s" );
	$dragIcon.css( "left", placeHolderOffset.left );
	$dragIcon.css( "top", placeHolderOffset.top );
	m_isAnimating = true;

	// After animation reset icon
	setTimeout( function () {
		$dragIcon.css( "transition-duration", "" );
		$dragIcon.css( "left", "" );
		$dragIcon.css( "top", "" );
		$dragIcon.css( "z-index", "" );
		$dragIcon.css( "cursor", "" );
		$dragIcon.removeClass( "icon-dragging" );
		m_$iconPlaceHolder.before( $dragIcon );
		m_$iconPlaceHolder.remove();
		m_isAnimating = false;
	}, 500 );

}

function verifyMovement( $icon, $dropLocation ) {
	var fileId, folderId;

	fileId = parseInt( $icon.data( "options" ).id );
	folderId = getWindowId( $dropLocation );

	return FileSystem.canMoveFile( fileId, folderId, true, false );
}

function getWindowId( $dropLocation ) {
	var $window;

	$window = $dropLocation.closest( ".window" );
	if( $window.length === 0 ) {
		return "/";
	} else {
		return parseInt( $window.data( "options" ).id )
	}
}

} )();
