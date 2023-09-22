"use strict";

//This object creates and maintains all the windows.
var WindowFactory = ( function () {

//Flag to track when a window is dragging
var bDraggingWindow = false;

//Flag to track when a window is resizing
var bResizeWindow = false;

//The active selected window
var $ActiveWindow;

//Last mouse coordinates
var lastMouseCoords;

//Array of zIndex to track window layering order
var $zIndexArray = [];

//The icon being dragged in a drag and drop operation
var $iconDrag = false;

//The place an icon will be dropped
var $iconBefore = false;

var bAnimatingWindowFlash = false;

var bIsMoble = Util.isMobile();

//Settings for the page as a whole
var settings = {
	minIconWidth: 75,			//Icon size for the default task bar
	minIconHeight: 75,			//
	$taskBar: false,			//Default minimized icon area
	highlightColor: "rgba(194, 230, 115, 0.35)"
};

//Provides access to methods in the WindowsFactory
var publicAPI = {
	"CreateWindow": CreateWindow,
	"Init": Init,
	"SetOnWindowResizeEvent": SetOnWindowResizeEvent,
	"SetOnKeydownEvent": SetOnKeydownEvent,
	"SetOnFocusEvent": SetOnFocusEvent,
	"SetOnBlurEvent": SetOnBlurEvent,
	"SetOnCloseWindow": SetOnCloseWindow,
	"SetActiveWindowFromElement": SetActiveWindowFromElement,
	"GetWindow": GetWindow,
	"GetActiveWindow": GetActiveWindow,
	"GetOpenWindows": GetOpenWindows,
	"IconButtonClick": IconButtonClick,
	"CloseWindow": CloseWindow,
	"GetZIndex": GetZIndex,
	"SetRecommendedPos": SetRecommendedPos
};

return publicAPI;

//Initialization function
function Init( p_settings ) {

	//Add the resize border div to the page
	var $divResize = $( "<div id='divResize'>" );

	// Prevent the default drag behavior
	$( "#main" ).on( 'dragstart', function( e ) { e.preventDefault(); } );
	$( "#main" ).append( $divResize );
	$( "#main" ).data( "highlightColor", settings.highlightColor );
	$( "#mainOverlay" ).hide();

	// Event for resizing the document
	$( window ).on( "resize", ResizeDocument );

	// Mouse down anywhere on page
	$( document ).on( "mousedown", MainMouseDown );

	//Event for dragging and resizing active window
	$( document ).on( "mousemove", MouseMove );
	
	//Event to start dragging
	$( document ).on( "mousedown", ".windowContents", ContentMouseDown );
	
	$( document ).on( "mousedown", ".dragItem", DragItemDown );
	
	//Event for releasing drag and resize
	$( document ).on( "mouseup", MouseUp );
	
	//Event to start resize
	$( document ).on( "mousedown", ".window", WindowMouseDown );
	
	//Event to change cursor for resize border
	$( document ).on( "mousemove", ".window", WindowMouseMove );

	$( document ).on( "keydown", KeyDown );

	$( document ).on( "contextmenu", "#main", ContextMenuEvent );

	//Update the settings
	settings = $.extend( {}, settings, p_settings );
	
	//Create the minimized area
	if( ! settings.$taskBar ) {
		settings.$taskBar = $( "<div class='taskBarDefault'>" );
		settings.$taskBar.data( "openWindows", [] );
		$( "#main" ).append( settings.$taskBar );
		SetDropArea( settings.$taskBar );
	} 
	
	$( "#main" ).data( "iconSize", {
		width: settings.minIconWidth,
		height: settings.minIconHeight
	} );
	
	$( "#main" ).data( "options", {
		path: "/"
	} );
}

function ResizeDocument() {
	var openWindows, i, $openWindow, pos;

	openWindows = WindowFactory.GetOpenWindows();
	for( i = 0; i < openWindows.length; i++ ) {
		$openWindow = openWindows[ i ].$window;
		pos = $openWindow.offset();
		pos.width = $openWindow.width();
		pos.height = $openWindow.height();
		SetRecommendedPos( pos, 0 );
		$openWindow.css( "left", pos.left );
		$openWindow.css( "top", pos.top );
		if( pos.widthChanged ) {
			$openWindow.css( "width", pos.width );
		}
		if( pos.heightChanged ) {
			$openWindow.css( "height", pos.height );
		}
		if( pos.widthChanged || pos.heightChanged ) {
			SetWindowInnerSize( $openWindow );
		}
	}
}

//Creates the window
function CreateWindow( p_options ) {

	//Set the window defaults
	var defaults = {
		"headerContent": "", 
		"bodyContent": "", 
		"footerContent": "",
		"toolbarContent": "",
		"width": 250,
		"height": 100,
		"borderSize": 3,
		"headerHeight": 0,
		"footerHeight": 0,
		"toolbarHeight": 0,
		"minBodyHeight": 100,
		"minWidth": 100,
		"$taskBar": settings.$taskBar,
		"isFolder": false,
		"path": false,
		"icon": "url(img/icon_default.png)",
		"name": "",
		"highlightColor": "rgba(194, 230, 115, 0.35)",
		"hideMin": false,
		"hideMax": false,
		"hideClose": false
	};

	//Set the default values but options will override
	var options = $.extend( {}, defaults, p_options );

	if( bIsMoble ) {
		options.hideMin = false;
		options.hideMax = true;
		options.left = 15;
		options.top = 0;
		options.width = $( document ).width();
		options.height = $( ".taskBarDefault" ).offset().top - 60;
	}

	if( isNaN( Number( options.left ) ) ) {
		if( lastMouseCoords && Number( lastMouseCoords.x ) ) {
			options.left = lastMouseCoords.x + 100;
		} else {
			options.left = 100;
		}
	}
	if( isNaN( Number( options.top ) ) ) {
		if( lastMouseCoords && ! isNaN( Number( lastMouseCoords.y ) ) ) {
			options.top = lastMouseCoords.y + 50;
		} else {
			options.top = 50;
		}
	}

	//Set the minimum height
	options.minHeight = options.minBodyHeight + options.headerHeight + options.footerHeight;
	
	//Create the window and containers
	var $window = $( "<div class='window'>" );
	var $windowContents = $( "<div class='windowContents'>" );
	var $windowHeader = $( "<div class='windowHeader'>" );
	var $windowBody = $( "<div class='windowBody'>" );
	var $windowFooter = $( "<div class='windowFooter'>" );
	var $windowButtons = $(
		CreateWindowButtonsStr( options.hideMin, options.hideMax, options.hideClose )
	);

	//Append the window containers to the window
	$windowHeader.append(
		"<div class='dragItem'><span>" + options.headerContent + "</span></div>"
	);
	$windowHeader.append( $windowButtons );
	$windowBody.append( options.bodyContent );
	$windowBody.data( "highlightColor", options.highlightColor );
	$windowFooter.append( options.footerContent );
	$windowContents.append( $windowHeader );
	$windowContents.append( options.toolbarContent );
	$windowContents.append( $windowBody );
	$windowContents.append( $windowFooter );
	$window.append( $windowContents );

	//Set the window size
	var pos = {
		"left": options.left,
		"top": options.top,
		"width": options.width,
		"height": options.height,
	};

	// Position the window
	SetRecommendedPos( pos, 0 );
	$window.css( "left", pos.left + "px" );
	$window.css( "top", pos.top + "px" );
	$window.width( pos.width );
	$window.height( pos.height );

	// Copy the size
	options.left = pos.left;
	options.top = pos.top;
	options.width = pos.width;
	options.height = pos.height;

	//Save the options to the window
	$window.data( "options", options );

	//Append the window to the page
	$( "#main" ).append( $window );

	//Resize the inner containers for the window
	SetWindowInnerSize( $window );

	//Set the default docking settings
	$window.data( "docked", false );

	//Add it to the zIndex order array
	$zIndexArray.push( $window );

	//Set it as the active window
	if( ! $ActiveWindow ) {
		$ActiveWindow = $window;
	}
	SetActiveWindow( $window, true );

	//Bind the window buttons
	BindWindowButtons( $windowButtons );

	//Create the task bar icon
	CreateIcon( $window, settings.$taskBar );

	if( options.isFolder ) {
		$window.data( "iconSize", {
			width: settings.minIconWidth,
			height: settings.minIconHeight
		} );
	}

	return $window;
}

function SetRecommendedPos( pos, margin ) {

	var docSize = Util.getWindowSize();

	// Make sure the window is not too big
	if( pos.width + margin > docSize.width ) {
		pos.width = docSize.width - margin;
		pos.widthChanged = true;
	}
	if( pos.height + margin > docSize.height ) {
		pos.height = docSize.height - margin;
		pos.heightChanged = true;
	}

	// Position the window left position
	if( pos.left - margin < 0 ) {
		pos.left = margin;
	}
	if( pos.left + pos.width + margin > docSize.width ) {
		pos.left = docSize.width - pos.width - margin;
	}

	// Position the window top position
	if( pos.top - margin < 0 ) {
		pos.top = margin;
	}
	if( pos.top + pos.height + margin > docSize.height ) {
		pos.top = docSize.height - pos.height - margin;
	}

}

//Make an element available to have icon's dropped in.
function SetDropArea( $element ) {
	//Event for when the dragging is eneded
	$element.on( "dragend", function ( e ) {
		//No longer dragging an icon
		if( $iconDrag ) {
			$iconDrag = false;
		}
		
		var $taskBar = settings.$taskBar;
		$taskBar.off( "dragover", TaskBarDragOver );
	} );
	
	//Event for dropping an icon on the task bar
	$element.on( "drop", function ( e ) {

		if( $iconDrag ) {
			//Set the link to the drag area for this window
			$iconDrag.data( "$window" ).data( "options" ).$taskBar = $( this );
		}
		
		//Stop propagation.
		e.stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
		
		var $taskBar = settings.$taskBar;
		$taskBar.off( "dragover", TaskBarDragOver );
	} );
}

//Creates an icon for the task bar area
function CreateIcon( $window, $taskBar ) {
	var titleName, $icon, iconImg;

	//Create the dom element
	titleName = $window.data( "options" ).name;

	// Convert iconImage to proper format
	iconImg = $window.data( "options" ).icon.replace( "url(", "" ).replace( ")", "" );

	var $icon = $(
		"<div class='divTsIcon'>" +
			"<img style='height: 18px' src='" + iconImg + "' />" +
			"<span class='spanTitle' >" + titleName + "</span>" +
		"</div>"
	);

	$taskBar.data( "openWindows" ).push( {
		$window: $window,
		$icon: $icon
	} );

	//Click event
	$icon.on( "click", IconButtonClick );

	//Make the icon draggable
	$icon.attr( "draggable", true );

	//drag start event
	$icon[ 0 ].addEventListener( "dragstart", IconDragStart, false );
	$icon.on( "dragend", function ( e ) {
		if( $iconDrag ) {
			$iconDrag = false;
		}
		$iconBefore = false;	
		var $taskBar = settings.$taskBar;
		$taskBar.off( "dragover", TaskBarDragOver );
	} );

	//Append icon to the dom
	$taskBar.append( $icon );

	//Add links to the window and vice versa
	$window.data( "$icon", $icon );
	$icon.data( "$window", $window );
}

function GetOpenWindows() {
	return settings.$taskBar.data( "openWindows" );
}

//HTML string for the min, dock, and close buttons
function CreateWindowButtonsStr( hideMin, hideMax, hideClose ) {
	var str;

	str = "<div class='windowButtons'>";
	if( ! hideMin ) {
		str += "<input type='button' value='' class='windowButtonMin' />";
	}
	if( ! hideMax ) {
		str += "<input type='button' value='' class='windowButtonMax' />";
	}
	if( ! hideClose ) {
		str += "<input type='button' value='' class='windowButtonClose' />";
	}
	str += "</div>";

	return str;
}

//Bind the events to the window buttons
function BindWindowButtons( $windowButtons ) {
	var $minButton = $windowButtons.find( ".windowButtonMin" );
	var $maxButton = $windowButtons.find( ".windowButtonMax" );
	var $closeButton = $windowButtons.find( ".windowButtonClose" );

	$minButton.on( "click", MinButtonClick );
	$maxButton.on( "click", MaxButtonClick );
	$closeButton.on( "click", CloseButtonClick );
}

//Minimze window button click event
function MinButtonClick( e ) {

	//Get the window
	var $window = GetWindow( $( this ) );
	
	var windowState = $window.data( "windowState" );
	if( ! windowState ) {
		windowState = {
			isMax: false		
		};
	}
	
	//Remember the size of the window
	windowState.left = $window.offset().left;
	windowState.top = $window.offset().top;
	windowState.width = $window.width();
	windowState.height = $window.height();
	
	$window.data("windowState", windowState);
	
	//Grab the taskbar icon for the window
	var $icon = $window.data( "$icon" );

	//Show a minimization animation
	$window.animate( {
			left: $icon.offset().left,
			top: $icon.offset().top,
			width: settings.minIconWidth,
			height: settings.minIconHeight
		}, {
		duration: 500,
		complete: function () {
			$window.hide();
		}
	} );
	
	//Window is minimized so show the icon has transparent
	$icon.css( "opacity", 0.6 );
}

//Start dragging icon
function IconDragStart( e ) {
	$iconDrag = $( this );

	//Set the min area drag over event
	var $taskBar = settings.$taskBar;
	$taskBar.on( "dragover", TaskBarDragOver );

	//Allow drag
	e.dataTransfer.effectAllowed = "move";
	e.dataTransfer.setData( "URL", this.innerHTML );
}

//Event for when dragging an icon over the task bar area
function TaskBarDragOver( e ) {
	//Check if there is actualy an icon being dragged
	if( $iconDrag ) {
		//Get the mouse coordinates
		var x = e.originalEvent.pageX;
		var y = e.originalEvent.pageY;

		//Find out if the icon is hovering over another icon
		var element = document.elementFromPoint( x, y );
		if (element.className === "divTsIcon" ) {
			var $iconOver = $( element );

			//Find out if cursor is over the left or right half of the icon
			if( x > $iconOver.width() / 2 + $iconOver.position().left ) {
				//Move the placeholder after the icon
				$iconOver.after( $iconDrag );
			} else {
				//Move the placeholder before the icon
				$iconOver.before($iconDrag);
			}
		} else {
			//Not hovering over an icon check if cursor is past the last icon
			var $last = $iconDrag.parent().children().last();
			if(
				( x > $last.offset().left + $iconDrag.width() && y > $last.offset().top ) ||
				( y > $last.offset().top + $last.height() )
			) {
				$last.after( $iconDrag );
			}
		}
	}
	
	//By default dragover is not allowed on DOM elements so remove the default behavior
	e.preventDefault();
}

//Click event on icon
function IconButtonClick( e ) {
	var $icon = $( this );
	var $window = $icon.data( "$window" );
	ActivateWindow( $window, $icon );
}

function ActivateWindow( $window, $icon ) {
	var bShowShadowAnimation = false;
	if( ! $icon ) {
		$icon = $window.data( "$icon" );
	}

	//If the window is hidden
	if( ! $window.is( ":visible" ) ) {
		//Set the window size to that before being minimized
		var windowState = $window.data( "windowState" );
		$window.css( "left", $icon.offset().left );
		$window.css( "top", $icon.offset().top );
		$window.show();
		
		//Set the icon to be not transparent
		$icon.css( "opacity", 1 );
		
		//Animate the window to original state
		$window.animate( {
				left: windowState.left,
				top: windowState.top,
				width: windowState.width,
				height: windowState.height
			},
			500,
			function () {
				
			}
		);
	}
	else {
		bShowShadowAnimation = true;
	}
	
	//Make the window the active window
	SetActiveWindow( $window );
	
	//Show an animation of a flash when clicked on an already opened icon
	if( bShowShadowAnimation ) {
		CreateFlash( $window, 25, 1000 );
		
		$icon.css( "background-color", "rgba(0, 0, 0, 0.5)" );
		setTimeout( function () {
			$icon.css( "background-color", "" );
		}, 1000 );
	}
}

//Creates an animation of a shadow flashing behind the element
function CreateFlash( $element, size, duration ) {
	//Create a new shadow element
	var $shadow = $( "<div class='windowBackgroundShadow'>" );

	var pageWidth = $( document ).width();
	var pageHeight = $( document ).height();
	
	var shadowLeft = $element.offset().left - size;
	var shadowTop = $element.offset().top - size;
	var shadowWidth = $element.width() + size * 2;
	var shadowHeight = $element.height() + size * 2;
	
	//Make sure shadow doesn't move past the edge of the window
	if( shadowWidth + shadowLeft > pageWidth ) {
		shadowWidth = pageWidth - shadowLeft;
		$shadow.css( "border-top-right-radius", "0px" );
		$shadow.css( "border-bottom-right-radius", "0px" );
	}
	
	//Make sure the shadow doesn't move past the edge of the window
	if( shadowHeight + shadowTop > pageHeight ) {
		shadowHeight = pageHeight - shadowTop;
		$shadow.css( "border-bottom-left-radius", "0px" );
		$shadow.css( "border-bottom-right-radius", "0px" );
	}
	
	//Set the properties of the shadow
	$shadow
		.css( "z-index", $element.css( "z-index" ) - 1 )
		.css( "left", shadowLeft + "px" )
		.css( "top", shadowTop + "px" )
		.width( shadowWidth )
		.height( shadowHeight );

	//Add the shadow to the page
	$( "#main" ).append( $shadow );
	
	//Flag to track if animation is running
	bAnimatingWindowFlash = true;
	
	//Start the shadow anmiation
	$shadow.animate( {
			opacity: 0.5
		},
		duration / 2,
		function () {
			//Anmiate the 2nd half of the shadow dissapearing, then remove when completed
			$( this ).animate( { opacity: 0 }, duration / 2, function () {
				$( this ).remove();
				bAnimatingWindowFlash = false;
			} );
		}
	);
}

//Click event for the dock button
function MaxButtonClick( e ) {
	var $maxButton = $( this );
	var $window = GetWindow( $maxButton );
	var windowState = $window.data( "windowState2" );
	if( ! windowState ) {
		windowState = {
			isMax: false
		};
	}

	var dest = {};
	if( windowState.isMax ) {
		$maxButton.removeClass( "windowButtonUnMax" );
		$maxButton.addClass( "windowButtonMax" );
		dest.x = windowState.left;
		dest.y = windowState.top;
		dest.width = windowState.width;
		dest.height = windowState.height;
		windowState.isMax = false;
	} else {
		dest.x = 0;
		dest.y = 0;
		dest.width = $( document ).width();
		dest.height = $( ".taskBarDefault" ).offset().top;
		$maxButton.removeClass( "windowButtonMax" );
		$maxButton.addClass( "windowButtonUnMax" );
		windowState.isMax = true;
		windowState.width = $window.width();
		windowState.height = $window.height();
		var offset = $window.offset();
		windowState.top = offset.top;
		windowState.left = offset.left;
	}
	
	$window.animate( {
		left: dest.x,
		top: dest.y,
		width: dest.width,
		height: dest.height
	}, {
		duration: 500,
		progress: function () {
			SetWindowInnerSize( $window );
		}
	} );

	$window.data( "windowState2", windowState );

}

//Click event for the close button
function CloseButtonClick( e ) {
	var $window = GetWindow( $( this ) );
	
	CloseWindow( $window );
}

function CloseWindow( $window ) {
	var openWindows, index

	// Before setting the new active window call the blur event
	if( $window.data( "OnCloseWindowCallback" ) ) {
		$window.data( "OnCloseWindowCallback" )();
	}

	openWindows = $window.data( "options" ).$taskBar.data( "openWindows" );
	index = -1;
	for( var i = 0; i < openWindows.length; i++ ) {
		if( openWindows[ i ].$window[ 0 ] === $window[ 0 ] ) {
			index = i;
			break;
		}
	}
	
	openWindows.splice( index, 1 );
	
	//Remove the icon
	$window.data( "$icon" ).remove();
	
	//Remove the window
	$window.remove();

}

function GetZIndex() {
	return $zIndexArray.length;
}

//Grab the window from an element inside it
function GetWindow( $element ) {
	var $window = $element;
	// while( $window.attr( 'class' ) != "window" && $window ) {
	// 	$window = $window.parent();
	// }
	$window = $window.closest( ".window" );

	return $window;
}

function GetActiveWindow() {
	return $ActiveWindow;
}

//Set the size of the inner containers for the window
function SetWindowInnerSize( $window ) {
	//Get the contents of the window
	var $windowContents = $window.find( ".windowContents" );
	var $windowHeader = $windowContents.find( ".windowHeader" );
	var $windowBody = $windowContents.find( ".windowBody" );
	var $windowFooter = $windowContents.find( ".windowFooter" );
	var	$windowButtons = $windowHeader.find( ".windowButtons" );
	
	//Grab the windows options
	var options = $window.data( "options" );
	var borderSize;
	var contentWidth;
	var contentHeight;

	//Set different sizes based on if the window is docked or not
	if( $window.data( "docked" ) ) {
		borderSize = 0;
		contentWidth = $window.width() - 2;
		contentHeight = $window.height() - 2;
	} else {
		borderSize = options.borderSize;
		contentWidth = $window.width() - ( borderSize * 2 );
		contentHeight = $window.height() - ( borderSize * 2 );
	}

	//Se the height of the body container
	var bodyHeight = contentHeight -
		( options.footerHeight + options.headerHeight + options.toolbarHeight );

	//Set the minimum size for the window = the body has to be minBodyHeight in size
	if( bodyHeight < options.minBodyHeight ) {
		//Find the difference between the minimum body height and the actual body height
		var diff = options.minBodyHeight - bodyHeight;
		
		//Increase the size of the contents
		contentHeight += diff;
		
		//Increase the size of the window
		$window.height($window.height() + diff);
		
		//Make the body the minimum body height
		bodyHeight = options.minBodyHeight;
	}
	
	//Set the sizes
	$windowContents.css( "left", borderSize );
	$windowContents.css( "top", borderSize );
	$windowContents.width( contentWidth );
	$windowContents.height( contentHeight );
	$windowHeader.height( options.headerHeight );
	$windowBody.height( bodyHeight );
	$windowFooter.height( options.footerHeight );
	
	//Set the window button position
	var windowHeaderOffset = $windowHeader.offset();
	$windowButtons.css( "left", ( $windowHeader.width() - $windowButtons.width() ) + "px" );
	
	//Check if a callback exists for the window
	if( $window.data("ResizeEventCallback" ) ) {
		//Attach the this to the window body object
		//$windowBody.ResizeEventCallback = $window.data("ResizeEventCallback");
		
		//Call the function
		//$windowBody.ResizeEventCallback();
		$window.data( "ResizeEventCallback" ).call( $windowBody[ 0 ] );
	}
}

//Make a window the active window and set it on the top of all the other windows
function SetActiveWindow( $window, isForce ) {

	//Check if the window is not already the active window
	if( isForce || $window[ 0 ] != $ActiveWindow[ 0 ] ) {

		// Assign the class to the active window
		$( ".activeWindow" ).removeClass( "activeWindow" );
		$window.addClass( "activeWindow" );

		//zIndex start value
		var zIndex = 1;

		//Index into the $zIndexArray
		var windowIndex = 0;

		//Loop through all windows in order
		for( var i = 0; i < $zIndexArray.length; i++ ) {

			//if it's the current window mark the location
			if( $zIndexArray[ i ][ 0 ] === $window[ 0 ] ) {
				windowIndex = i;
			} else {
				//else apply the zIndex and increment
				$zIndexArray[ i ].css( "z-index", zIndex++ );
			}
		}

		//Remove the window from the array
		$zIndexArray.splice( windowIndex, 1 );

		//Move window to top of the array
		$zIndexArray.push( $window );
		$window.css( "z-index", zIndex );

		// Before setting the new active window call the blur event
		if( $ActiveWindow && $ActiveWindow.data( "BlurEventCallback" ) ) {
			$ActiveWindow.data( "BlurEventCallback" )();
		}

		//Set the active window
		$ActiveWindow = $window;

		//Check if a callback exists for the window
		if( $ActiveWindow.data( "FocusEventCallback" ) ) {
			$ActiveWindow.data( "FocusEventCallback" )();
		}

	}
}

//Sets the active window from an element
function SetActiveWindowFromElement( $element ) {
	var $window = GetWindow( $element );
	ActivateWindow( $window );
	//SetActiveWindow( $window );
}

//Event to disable the text selection 
function DisableWrap( e ) {
	e.stopPropagation();
	e.preventDefault();
}

function KeyDown( e ) {

	//Check if a callback exists for the window
	if( $ActiveWindow && $ActiveWindow.data( "KeydownEventCallback" ) ) {
		$ActiveWindow.data( "KeydownEventCallback" )( e );
	}

}

//Document event for mouse up
function MouseUp( e ) {

	$( "#mainOverlay" ).hide();

	//Check if their is an active window selected and a window is being resized
	if( bResizeWindow ) {
		var windowBorderSize = $ActiveWindow.data( "options" ).borderSize;
	
		//Get the resize div that shows the dashed lines
		var $divResize = $( "#divResize" );
		
		//Set the size of the window
		var newWidth = $divResize.width() + windowBorderSize;
		var newHeight = $divResize.height() + windowBorderSize;
		$ActiveWindow.width( newWidth );
		$ActiveWindow.height( newHeight );
		
		//Set the position of the window
		var resizeOffset = $divResize.offset();
		$ActiveWindow.css( "left", ( resizeOffset.left + windowBorderSize ) + "px" );
		$ActiveWindow.css( "top", ( resizeOffset.top + windowBorderSize ) + "px" );

		//Set the size for the windows contents
		SetWindowInnerSize( $ActiveWindow );
		$divResize.hide();
	}
	
	//Reset the drag and resize flags
	bDraggingWindow = false;
	bResizeWindow = false;
	
	//Enable text selection
	$( document ).off( "selectstart", DisableWrap );
}

//Document event for moving the mouse
function MouseMove( e ) {

	//Check if window is being dragged
	if( bDraggingWindow ) {
		//Get the size of the document
		var documentWidth = $( document ).width();
		var documentHeight = $( document ).height();
		
		//Get the size and position of the window
		var activeWindowWidth = $ActiveWindow.width();
		var activeWindowHeight = $ActiveWindow.height();
		var offset = $ActiveWindow.offset();
		
		//Get the new location of the window
		var newLeft = offset.left + ( e.pageX - lastMouseCoords.x );
		var newTop = offset.top + ( e.pageY - lastMouseCoords.y );

		//Enforce bounds for new window position
		if( newLeft < 0) {
			newLeft = 0;
		}

		if( newLeft >= documentWidth - activeWindowWidth ) {
			newLeft = documentWidth - activeWindowWidth;
		}

		if( newTop < 0 ) {
			newTop = 0;
		}

		if( newTop >= documentHeight - activeWindowHeight ) {
			newTop = documentHeight - activeWindowHeight;
		}

		//Set the new window position
		$ActiveWindow.css( "left", newLeft );
		$ActiveWindow.css( "top", newTop );
		
		if( bAnimatingWindowFlash ) {
			$( ".windowBackgroundShadow" ).remove();
		}
	}
	//Check if the window is being resized
	else if ( bResizeWindow ) {
		//Get the border size
		var options = $ActiveWindow.data( "options" );
		var windowBorderSize = options.borderSize;

		//Get the resize dimensions
		var $divResize = $( "#divResize" );
		var resizeWidth = $divResize.width();
		var resizeHeight = $divResize.height();
		var resizeOffset = $divResize.offset();
		var resizeLeft = resizeOffset.left;
		var resizeTop = resizeOffset.top;
		var resizeRight = resizeLeft + resizeWidth;
		var resizeBottom = resizeTop + resizeHeight;

		//Flags for if the window is being moved in addition to resized
		var bMoveUp = false;
		var bMoveLeft = false;

		//Set the size and position based on the resize direction
		var strCursor = $divResize.css( "cursor" );
		if( strCursor === "e-resize" ) {
			resizeWidth += ( e.pageX - lastMouseCoords.x );
		} else if( strCursor === "w-resize" ) {
			resizeWidth -= ( e.pageX - lastMouseCoords.x );
			resizeLeft += ( e.pageX - lastMouseCoords.x );
			bMoveLeft = true;
		} else if( strCursor === "s-resize" ) {
			resizeHeight += ( e.pageY - lastMouseCoords.y );
		} else if( strCursor === "n-resize" ) {
			resizeHeight -= ( e.pageY - lastMouseCoords.y );
			resizeTop += ( e.pageY - lastMouseCoords.y );
			bMoveUp = true;
		} else if( strCursor === "se-resize" ) {
			resizeWidth += ( e.pageX - lastMouseCoords.x );
			resizeHeight += ( e.pageY - lastMouseCoords.y );
		} else if( strCursor === "ne-resize" ) {
			resizeWidth += ( e.pageX - lastMouseCoords.x );
			resizeHeight -= ( e.pageY - lastMouseCoords.y );
			resizeTop += ( e.pageY - lastMouseCoords.y );
			bMoveUp = true;
		} else if( strCursor === "sw-resize" ) {
			resizeWidth -= ( e.pageX - lastMouseCoords.x );
			resizeLeft += ( e.pageX - lastMouseCoords.x );
			resizeHeight += ( e.pageY - lastMouseCoords.y );
			bMoveLeft = true;
		} else if( strCursor === "nw-resize" ) {
			resizeWidth -= ( e.pageX - lastMouseCoords.x );
			resizeLeft += ( e.pageX - lastMouseCoords.x );
			resizeHeight -= ( e.pageY - lastMouseCoords.y );
			resizeTop += ( e.pageY - lastMouseCoords.y );
			bMoveLeft = true;
			bMoveUp = true;
		}

		//Get document dimensions
		var documentWidth = $( document ).width();
		var documentHeight = $( document ).height();

		//Constrain the window to the document on the left side
		if ( resizeLeft < 0 && bMoveLeft ) {
			resizeLeft = $( "#divResize" ).offset().left;
			resizeWidth = $( "#divResize" ).width();
		}

		//Constrain the window to the document on the right side
		if( resizeLeft >= documentWidth - resizeWidth - windowBorderSize * 3 && !bMoveLeft ) {
			resizeWidth = $( "#divResize" ).width();
			resizeLeft = $( "#divResize" ).offset().left;
		}

		//Constrain the window to the document on the top side
		if( resizeTop < 0 && bMoveUp ) {
			resizeTop = $( "#divResize" ).offset().top;
			resizeHeight = $( "#divResize" ).height();
		}

		//Constrain the window to the document on the bottom side
		if( resizeTop >= documentHeight - resizeHeight - windowBorderSize * 3 && ! bMoveUp ) {
			resizeHeight = $( "#divResize" ).height();
			resizeTop = $( "#divResize" ).offset().top;
		}

		//Make sure the resize width is greater then the minimum width
		if( resizeWidth < options.minWidth - windowBorderSize ) {
			if( bMoveLeft ) {
				resizeLeft = resizeRight - ( options.minWidth - windowBorderSize );
			} else {
				resizeLeft = resizeOffset.left;
			}
			resizeWidth = options.minWidth - windowBorderSize;
		}

		//Make sure the resize height is greater then the minimum height
		if( resizeHeight < options.minHeight + windowBorderSize ) {
			if( bMoveUp ) {
				resizeTop = resizeBottom - ( options.minHeight + windowBorderSize );
			} else {
				resizeTop = resizeOffset.top;
			}
			resizeHeight = options.minHeight + windowBorderSize;
		}
			
		//Set the size and position of the resize div
		$( "#divResize" )
			.width( resizeWidth )
			.height( resizeHeight )
			.css( "left", resizeLeft + "px" )
			.css( "top", resizeTop + "px" );
	}

	//record the last mouse coordinates
	lastMouseCoords = { x: e.pageX, y: e.pageY };
}

//Content event for mouse down
function ContentMouseDown( e ) {
	var $parentWindow = $( this ).closest( ".window" );

	//Set the active window
	SetActiveWindow( $parentWindow );

	// Trigger the main mouse down event
	MainMouseDown( e );

	//Stop propagation
	e.stopImmediatePropagation();	
}

function DragItemDown( e ) {
	//If it's not docked then start the dragging process
	if ( ! $ActiveWindow.data("docked") ) {
		bDraggingWindow = true;
		$( "#mainOverlay" )
			.show()
			.css( "zIndex", $zIndexArray.length + 1 )
			.css( "cursor", "move" );
	}

	//Disable selection
	$( document ).on( "selectstart", DisableWrap );
}

//Div window event for mouse down (user starts resizing)
function WindowMouseDown( e ) {
	//Set flag to indicate window is resizing
	bResizeWindow = true;

	//Set the active window
	SetActiveWindow( $( this ) );

	//Disable selection
	$( document ).on( "selectstart", DisableWrap );
	
	//Get the border size for the window
	var windowBorderSize = $ActiveWindow.data( "options" ).borderSize;
	
	//Set the divResize match the size and location of the window
	$( "#divResize" )
		.width( $ActiveWindow.width() - windowBorderSize )
		.height( $ActiveWindow.height() - windowBorderSize )
		.css( "left", ( $ActiveWindow.offset().left - windowBorderSize ) + "px" )
		.css( "top", ( $ActiveWindow.offset().top - windowBorderSize ) + "px" )
		.css( "cursor", $ActiveWindow.css( "cursor" ) )
		.css( "z-index", $zIndexArray.length + 1 )
		.show();

	$( "#mainOverlay" )
		.show()
		.css( "zIndex", $zIndexArray.length + 1 )
		.css( "cursor", $ActiveWindow.css( "cursor" ) );
}

//Div window event for mouse move (mouse is hovering of resize border)
function WindowMouseMove( e ) {
	var $hover;

	$hover = $( document.elementFromPoint( e.pageX, e.pageY ) );

	//Make sure the mouse over document is the window
	if( $hover.hasClass( "window" ) ) {
		var $this = $( this );
		var windowBorderSize = $this.data( "options" ).borderSize;

		//Calculate the middle of the window
		var halfWidth = $this.width() / 2;
		var halfHeight = $this.height() / 2;

		//For firefox get the local mouse coordinates
		if( e.offsetX == undefined ) {
			var offset = $this.offset();
			e.offsetX = e.pageX - offset.left;
			e.offsetY = e.pageY - offset.top;
		}

		//North and south resize
		if( e.offsetX > windowBorderSize && e.offsetX < $this.width() - windowBorderSize ) {
			if( e.offsetY <= windowBorderSize ) {
				$this.css("cursor", "n-resize");
			} else {
				$this.css("cursor", "s-resize");
			}
		}
		//NE Corner
		else if( e.offsetX >= halfWidth && e.offsetY <= windowBorderSize ) {
			$this.css( "cursor", "ne-resize" );
		//SE Corner
		} else if( e.offsetX >= halfWidth && e.offsetY >= $this.height() - windowBorderSize ) {
			$this.css( "cursor", "se-resize" );
		//NW Corner
		} else if( e.offsetX < halfWidth && e.offsetY <= windowBorderSize ) {
			$this.css( "cursor", "nw-resize" );
		//SW Corner
		} else if( e.offsetX < halfWidth && e.offsetY >= $this.height() - windowBorderSize ) {
			$this.css("cursor", "sw-resize");
		//E-W resize
		} else if( e.offsetX >= halfWidth ) {
			$this.css( "cursor", "e-resize" );
		} else {
		//W resize
			$this.css( "cursor", "w-resize" );
		}
	}
}

function MainMouseDown( e ) {
	var $clickLocation = $( document.elementFromPoint( e.pageX, e.pageY ) );
	if( ! $clickLocation.parent().hasClass( "contextmenu" ) ) {
		ContextMenu.Close();
	}
}

function ContextMenuEvent( e ) {
	ContextMenu.Open( e );
}

//Bind a resize event for when a window resizes -- Designed for the contentTiles.js plugin
function SetOnWindowResizeEvent( $window, functionCallback ) {
	if( $window.hasClass( "window" ) ) {
		$window = GetWindow( $window );
	}

	$window.data( "ResizeEventCallback", functionCallback );
}

//Bind a resize event for when a window resizes -- Designed for the contentTiles.js plugin
function SetOnKeydownEvent( $window, functionCallback ) {
	if( $window.hasClass( "window" ) ) {
		$window = GetWindow( $window );
	}

	$window.data( "KeydownEventCallback", functionCallback );
}

function SetOnFocusEvent( $window, functionCallback ) {
	if( $window.hasClass( "window" ) ) {
		$window = GetWindow( $window );
	}

	$window.data( "FocusEventCallback", functionCallback );
}

function SetOnBlurEvent( $window, functionCallback ) {
	if( $window.hasClass( "window" ) ) {
		$window = GetWindow( $window );
	}

	$window.data( "BlurEventCallback", functionCallback );
}

function SetOnCloseWindow( $window, functionCallback ) {
	if( $window.hasClass( "window" ) ) {
		$window = GetWindow( $window );
	}

	$window.data( "OnCloseWindowCallback", functionCallback );
}

} )();
