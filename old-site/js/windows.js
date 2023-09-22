//This object creates and maintains all the windows.
var WindowFactory = (function () 
{
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
	
	//Settings for the page as a whole
	var settings = {
		minIconWidth: 50,			//Icon size for the default task bar
		minIconHeight: 50,		
		$taskBar: false,			//Default minimized icon area
		highlightColor: "rgba(200, 200, 200, 0.25)"
	};
	
	//Provides access to methods in the WindowsFactory
	var publicAPI = {
		CreateWindow: CreateWindow,		
		Init: Init,
		SetOnWindowResizeEvent: SetOnWindowResizeEvent,
		SetActiveWindowFromElement: SetActiveWindowFromElement,
		GetWindow: GetWindow,
		GetOpenWindows: GetOpenWindows,
		IconButtonClick: IconButtonClick
	};
	
	return publicAPI;
	
	//Initialization function
	function Init(p_settings)
	{
		//Add the resize border div to the page
		var $divResize = $("<div id='divResize'>");	
		$(document.body).append($divResize);	
		$(document.body).data("highlightColor", settings.highlightColor);
		
		//Event for dragging and resizing active window
		$(document).on("mousemove", MouseMove);
		
		//Event to start dragging
		$(document).on("mousedown", ".windowContents", ContentMouseDown);
		
		$(document).on("mousedown", ".dragItem", DragItemDown);
		
		//Event for releasing drag and resize
		$(document).on("mouseup", MouseUp);
		
		//Event to start resize
		$(document).on("mousedown", ".window", WindowMouseDown);
		
		//Event to change cursor for resize border
		$(document).on("mousemove", ".window", WindowMouseMove);	
	
		//Update the settings
		settings = $.extend({}, settings, p_settings);
		
		//Create the minimized area
		if(!settings.$taskBar)
		{
			settings.$taskBar = $("<div class='taskBarDefault'>");
			settings.$taskBar.data("openWindows", []);
			$(document.body).append(settings.$taskBar);
			SetDropArea(settings.$taskBar);
		} 
		
		$(document.body).data("iconSize", {
			width: settings.minIconWidth,
			height: settings.minIconHeight
		});
		
		$(document.body).data("options", {
			path: "root"
		});
	}
	
	//Update the settings
	function Settings(p_settings)
	{
		settings = $.extend({}, settings, p_settings);
	}
	
	//Creates the window
	function CreateWindow(p_options)
	{
		//Set the window defaults
		var defaults = {
			headerContent: "", 
			bodyContent: "", 
			footerContent: "",
			toolbarContent: "",
			left: 100,
			top: 100,
			width: 250,
			height: 100,
			borderSize: 3,
			headerHeight: 0,
			footerHeight: 0,
			toolbarHeight: 0,
			minBodyHeight: 100,
			minWidth: 100,
			$taskBar: settings.$taskBar,
			bFolder: false,
			path: false,
			icon: "url(img/icon_default.png)",
			name: "",
			highlightColor: "rgba(170, 170, 170, 0.5)"
		};
		
		//Set the default values but options will override
		var options = $.extend({}, defaults, p_options);

		//Set the minimum height
		options.minHeight = options.minBodyHeight + options.headerHeight + options.footerHeight;
		
		//Create the window and containers
		var $window = $("<div class='window'>");
		var $windowContents = $("<div class='windowContents'>");		
		var $windowHeader = $("<div class='windowHeader dragItem'>");
		var $windowBody = $("<div class='windowBody'>");
		var $windowFooter = $("<div class='windowFooter'>");
		var $windowButtons = $(CreateWindowButtonsStr());
				
		//Append the window containers to the window
		$windowHeader.append("<span>" + options.headerContent + "</span>");
		$windowHeader.append($windowButtons);
		$windowBody.append(options.bodyContent);
		$windowBody.data("highlightColor", options.highlightColor);
		$windowFooter.append(options.footerContent);
		$windowContents.append($windowHeader);		
		$windowContents.append(options.toolbarContent);
		$windowContents.append($windowBody);
		$windowContents.append($windowFooter);
		$window.append($windowContents);		
		
		//Set the window size
		$window.width(options.width);
		$window.height(options.height);
		
		//Save the options to the window
		$window.data("options", options);
				
		//Append the window to the page
		$(document.body).append($window);	
		
		//Resize the inner containers for the window
		SetWindowInnerSize($window);
		
		//Position the window
		$window.css("left", options.left + "px");
		$window.css("top", options.top + "px");
		
		//Set the default docking settings
		$window.data("docked", false);
		
		//Add it to the zIndex order array
		$zIndexArray.push($window);
		
		//Set it as the active window
		if(!$ActiveWindow)
			$ActiveWindow = $window;
		SetActiveWindow($window);	
		
		//Bind the window buttons
		BindWindowButtons($windowButtons);
		
		//Create the task bar icon
		CreateIcon($window, settings.$taskBar);
		
		if(options.bFolder)
		{
			$window.data("iconSize", {
				width: settings.minIconWidth,
				height: settings.minIconHeight
			});
		}
		
		return $window;
	}	
	
	//Make an element available to have icon's dropped in.
	function SetDropArea($element)
	{		
		//Event for when the dragging is eneded
		$element.on("dragend", function (e) { 	
			//No longer dragging an icon
			if($iconDrag)
			{				
				$iconDrag = false;			
			}			
			
			var $taskBar = settings.$taskBar;
			$taskBar.off("dragover", TaskBarDragOver);
		});
		
		//Event for dropping an icon on the task bar
		$element.on("drop", function (e) {

			if($iconDrag)
			{
				//Set the link to the drag area for this window
				$iconDrag.data("$window").data("options").$taskBar = $(this);
			}
			
			//Stop propagation.
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
			
			var $taskBar = settings.$taskBar;
			$taskBar.off("dragover", TaskBarDragOver);
		});
	}	
	
	//Creates an icon for the task bar area
	function CreateIcon($window, $taskBar)
	{		
		//Create the dom element
		var titleName = $window.data("options").name;
		//if(titleName.length > 12)
		//    titleName = titleName.substring(0, 9) + "...";
		    
		var $icon = $("<div class='divTsIcon'><span class='spanTitle' style='top: " + 
		    (settings.minIconHeight + 13) + "px' >" + titleName + 
		    "</span></div>");
		
		$taskBar.data("openWindows").push({
			$window: $window,
			$icon: $icon
		});
		
		//Set the icon size
		$icon.width( settings.minIconWidth + 5);
		$icon.height( settings.minIconHeight + 5);	
		
		//Set the icon image
		$icon.css("background", $window.data("options").icon + "no-repeat center");		
		
		//Click event
		$icon.on("click", IconButtonClick);
		
		//Make the icon draggable
		$icon.attr("draggable", true);
		
		//drag start event
		$icon[0].addEventListener("dragstart", IconDragStart, false);
		$icon.on("dragend", function (e) { 
			if($iconDrag)
			{				
				$iconDrag = false;			
			}	
			$iconBefore = false;	
			var $taskBar = settings.$taskBar;
			$taskBar.off("dragover", TaskBarDragOver);
		});
		
		//Append icon to the dom
		$taskBar.append($icon);	
		
		//Add links to the window and vice versa
		$window.data("$icon", $icon);
		$icon.data("$window", $window);
	}
	
	function GetOpenWindows()
	{
		return settings.$taskBar.data("openWindows");
	}
	
	//HTML string for the min, dock, and close buttons
	function CreateWindowButtonsStr()
	{
		return "" +
			"<div class='windowButtons'>" + 
				"<input type='button' value='' class='windowButtonMin' />" +
				"<input type='button' value='' class='windowButtonMax' />" +
				"<input type='button' value='' class='windowButtonClose' />" +
			"</div>";
	}
	
	//Bind the events to the window buttons
	function BindWindowButtons($windowButtons)
	{
		var $minButton = $windowButtons.find(".windowButtonMin");
		var $maxButton = $windowButtons.find(".windowButtonMax");
		var $closeButton = $windowButtons.find(".windowButtonClose");
		
		$minButton.on("click", MinButtonClick);
		$maxButton.on("click", MaxButtonClick);
		$closeButton.on("click", CloseButtonClick);
	}
	
	//Minimze window button click event
	function MinButtonClick(e)
	{
		//Get the window
		var $window = GetWindow($(this));
		
		var windowState = $window.data("windowState");
		if(!windowState)
		{
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
		var $icon = $window.data("$icon");
	
		//Show a minimization animation
		$window.animate({
				left: $icon.offset().left,
				top: $icon.offset().top,
				width: settings.minIconWidth,
				height: settings.minIconHeight
			}, {
			duration: 500,
			complete: function () {
				$window.hide();					
			}
		});
		
		//Window is minimized so show the icon has transparent
		$icon.css("opacity", 0.6);
	}
	
	//Start dragging icon
	function IconDragStart(e)
	{
		$iconDrag = $(this);
		
		//Set the min area drag over event
		var $taskBar = settings.$taskBar;
		$taskBar.on("dragover", TaskBarDragOver);
		
		//Allow drag
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("URL", this.innerHTML);		
	}
	
	//Event for when dragging an icon over the task bar area
	function TaskBarDragOver(e)
	{
		//Check if there is actualy an icon being dragged
		if($iconDrag)
		{
			//Get the mouse coordinates				
			var x = e.originalEvent.pageX;
			var y = e.originalEvent.pageY;
			
			//Find out if the icon is hovering over another icon
			var element = document.elementFromPoint(x, y);
			if(element.className === "divTsIcon")
			{
				var $iconOver = $(element);					
				
				//Find out if cursor is over the left or right half of the icon
				if(x > $iconOver.width() / 2 + $iconOver.position().left)
				{
					//Move the placeholder after the icon
					$iconOver.after($iconDrag);
				}
				else
				{
					//Move the placeholder before the icon
					$iconOver.before($iconDrag);
				}							
			}
			else
			{
				//Not hovering over an icon check if cursor is past the last icon
				var $last = $iconDrag.parent().children().last();
				if((x > $last.offset().left + $iconDrag.width() && y > $last.offset().top) || 
					(y > $last.offset().top + $last.height()))
				{						
					$last.after($iconDrag);
				}					
			}
		}
		
		//By default dragover is not allowed on DOM elements so remove the default behavior
		e.preventDefault(); 	
	}
	
	//Click event on icon
	function IconButtonClick(e)
	{
		var $icon = $(this);
		var $window = $icon.data("$window");
		var bShowShadowAnimation = false;
		
		//If the window is hidden
		if(!$window.is(":visible"))
		{
			//Set the window size to that before being minimized
			var windowState = $window.data("windowState");			
			$window.css("left", $icon.offset().left);
			$window.css("top", $icon.offset().top);
			$window.show();
			
			//Set the icon to be not transparent
			$icon.css("opacity", 1);
			
			//Animate the window to original state
			$window.animate(
				{
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
		else
		{
			bShowShadowAnimation = true;
		}
		
		//Make the window the active window
		SetActiveWindow($window);
		
		//Show an animation of a flash when clicked on an already opened icon
		if(bShowShadowAnimation)
		{			
			CreateFlash($window, 25, 1000);
			
			$icon.css("background-color", "rgba(0, 0, 0, 0.5)");
			setTimeout(function () {
				$icon.css("background-color", "");
			}, 1000);			
		}		
	}
	
	//Creates an animation of a shadow flashing behind the element
	function CreateFlash($element, size, duration)
	{		
		//Create a new shadow element
		var $shadow = $("<div class='windowBackgroundShadow'>");

		var pageWidth = $(document).width();
		var pageHeight = $(document).height();
		
		var shadowLeft = $element.offset().left - size;
		var shadowTop = $element.offset().top - size;
		var shadowWidth = $element.width() + size * 2;
		var shadowHeight = $element.height() + size * 2;
		
		//Make sure shadow doesn't move past the edge of the window
		if(shadowWidth + shadowLeft > pageWidth)
		{
			shadowWidth = pageWidth - shadowLeft;
			$shadow.css("border-top-right-radius", "0px");
			$shadow.css("border-bottom-right-radius", "0px");
		}
		
		//Make sure the shadow doesn't move past the edge of the window
		if(shadowHeight + shadowTop > pageHeight)
		{
			shadowHeight = pageHeight - shadowTop;
			$shadow.css("border-bottom-left-radius", "0px");
			$shadow.css("border-bottom-right-radius", "0px");
		}	
		
		//Set the properties of the shadow
		$shadow
			.css("z-index", $element.css("z-index") - 1)
			.css("left", shadowLeft + "px")
			.css("top", shadowTop + "px")
			.width(shadowWidth)
			.height(shadowHeight);

		//Add the shadow to the page
		$(document.body).append($shadow);
		
		//Flag to track if animation is running
		bAnimatingWindowFlash = true;
		
		//Start the shadow anmiation
		$shadow.animate(
			{
				opacity: 0.5
			},			
			duration / 2,
			function () {
				//Anmiate the 2nd half of the shadow dissapearing, then remove when completed
				$(this).animate({opacity:0},duration/2,function () { 
					$(this).remove(); 
					bAnimatingWindowFlash = false;
				});					
			}
		);
	}
	
	//Click event for the dock button
	function MaxButtonClick(e)
	{
		var $maxButton = $(this);
		var $window = GetWindow($maxButton);
		var windowState = $window.data("windowState2");
		if(!windowState)
		{
			windowState = {
				isMax: false		
			};
		}
		
		var dest = {};
		if(windowState.isMax)
		{
			$maxButton.removeClass("windowButtonUnMax");
			$maxButton.addClass("windowButtonMax");
			dest.x = windowState.left;
			dest.y = windowState.top;
			dest.width = windowState.width;
			dest.height = windowState.height;
			windowState.isMax = false;
		}
		else
		{
			dest.x = 0;
			dest.y = 0;
			dest.width = $(document).width();
			dest.height = $(".taskBarDefault").offset().top;
			$maxButton.removeClass("windowButtonMax");
			$maxButton.addClass("windowButtonUnMax");
			windowState.isMax = true;
			windowState.width = $window.width();
			windowState.height = $window.height();
			var offset = $window.offset();
			windowState.top = offset.top;
			windowState.left = offset.left;
		}
		
		$window.animate({
			left: dest.x,
			top: dest.y,
			width: dest.width,
			height: dest.height
		}, {
			duration: 500,
			progress: function () {
				SetWindowInnerSize($window);
			}
		});
		
		// $window.css("left", dest.x);
		// $window.css("top", dest.y);
		// $window.css("width", dest.width);
		// $window.css("height", dest.height);
		
		$window.data("windowState2", windowState);
		
	}
	
	//Click event for the close button
	function CloseButtonClick(e)
	{
		var $window = GetWindow($(this));
		
		var openWindows = $window.data("options").$taskBar.data("openWindows");
		
		var index = -1;
		for(var i = 0; i < openWindows.length; i++)
		{
			if(openWindows[i].$window[0] === $window[0])
			{
				index = i;
				break;
			}
		}
		
		openWindows.splice(index, 1);
		
		//Remove the icon
		$window.data("$icon").remove();
		
		//Remove the window
		$window.remove();		
	}
	
	//Grab the window from an element inside it
	function GetWindow($element)
	{
		var $window = $element;
		while($window.attr('class') != "window" && $window)
		{
			$window = $window.parent();
		}
		
		return $window;
	}
	
	//Set the size of the inner containers for the window
	function SetWindowInnerSize($window)
	{		
		//Get the contents of the window
		var $windowContents = $window.find(".windowContents");
		var $windowHeader = $windowContents.find(".windowHeader");		
		var $windowBody = $windowContents.find(".windowBody");
		var $windowFooter = $windowContents.find(".windowFooter");	
		var	$windowButtons = $windowHeader.find(".windowButtons");
		
		//Grab the windows options
		var options = $window.data("options");
		var borderSize;
		var contentWidth;
		var contentHeight;

		//Set different sizes based on if the window is docked or not
		if($window.data("docked"))
		{
			borderSize = 0;
			contentWidth = $window.width() - 2;
			contentHeight = $window.height() - 2;			
		}
		else
		{
			borderSize = options.borderSize;
			contentWidth = $window.width() - (borderSize * 2);
			contentHeight = $window.height() - (borderSize * 2);
		}
		
		//Se the height of the body container
		var bodyHeight = contentHeight - (options.footerHeight + options.headerHeight + options.toolbarHeight);
		
		//Set the minimum size for the window = the body has to be minBodyHeight in size
		if(bodyHeight < options.minBodyHeight)
		{
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
		$windowContents.css("left", borderSize);
		$windowContents.css("top", borderSize);		
		$windowContents.width(contentWidth);
		$windowContents.height(contentHeight);
		$windowHeader.height(options.headerHeight);						
		$windowBody.height(bodyHeight);
		$windowFooter.height(options.footerHeight);
		
		//Set the window button position
		var windowHeaderOffset = $windowHeader.offset();
		$windowButtons.css("left", ($windowHeader.width() - $windowButtons.width()) + "px");
		
		//Check if a callback exists for the window
		if($window.data("ResizeEventCallback"))
		{
			//Attach the this to the window body object
			//$windowBody.ResizeEventCallback = $window.data("ResizeEventCallback");
			
			//Call the function
			//$windowBody.ResizeEventCallback();
			$window.data("ResizeEventCallback").call($windowBody[0]);
			
		}
	}
	
	//Make a window the active window and set it on the top of all the other windows
	function SetActiveWindow($window)
	{
		//Check if the window is not already the active window
		if($window[0] != $ActiveWindow[0])
		{
			//zIndex start value
			var zIndex = 1;
			
			//Index into the $zIndexArray
			var windowIndex = 0;
			
			//Loop through all windows in order
			for(var i = 0; i < $zIndexArray.length; i++)
			{
				//if it's the current window mark the location
				if($zIndexArray[i][0] === $window[0])
				{
					windowIndex = i;
				}
				else
				{
					//else apply the zIndex and increment
					$zIndexArray[i].css("z-index", zIndex++);
				}
			}
			
			//Remove the window from the array
			$zIndexArray.splice(windowIndex, 1);
			
			//Move window to top of the array
			$zIndexArray.push($window);
			$window.css("z-index", zIndex);
			
			//Set the active window
			$ActiveWindow = $window;
		}
	}
	
	//Sets the active window from an element
	function SetActiveWindowFromElement($element)
	{
		var $window = GetWindow($element);
		SetActiveWindow($window);
	}
	
	//Event to disable the text selection 
	function DisableWrap(e)
	{
		e.stopPropagation();
		e.preventDefault();
	}

	//Document event for mouse up
	function MouseUp(e)
	{
		//Check if their is an active window selected and a window is being resized
	    if (bResizeWindow)
		{
			var windowBorderSize = $ActiveWindow.data("options").borderSize;
		
			//Get the resize div that shows the dashed lines
			var $divResize = $("#divResize");
			
			//Set the size of the window
			var newWidth = $divResize.width() + windowBorderSize;
			var newHeight = $divResize.height() + windowBorderSize;
			$ActiveWindow.width(newWidth);
			$ActiveWindow.height(newHeight);
			
			//Set the position of the window
			var resizeOffset = $divResize.offset();
			$ActiveWindow.css("left", (resizeOffset.left + windowBorderSize) + "px");
			$ActiveWindow.css("top", (resizeOffset.top + windowBorderSize) + "px");

			//Set the size for the windows contents
			SetWindowInnerSize($ActiveWindow);
			$divResize.hide();
		}
		
		//Reset the drag and resize flags
		bDraggingWindow = false;
		bResizeWindow = false;
		
		//Enable text selection
		$(document).off("selectstart", DisableWrap);
	}
	
	//Document event for moving the mouse
	function MouseMove(e)
	{
		//Check if window is being dragged
		if (bDraggingWindow)
		{
			//Get the size of the document
			var documentWidth = $(document).width();
			var documentHeight = $(document).height();
			
			//Get the size and position of the window
			var activeWindowWidth = $ActiveWindow.width();
			var activeWindowHeight = $ActiveWindow.height();
			var offset = $ActiveWindow.offset();
			
			//Get the new location of the window
			var newLeft = offset.left + (e.pageX - lastMouseCoords.x);
			var newTop = offset.top + (e.pageY - lastMouseCoords.y);

			//Enforce bounds for new window position
			if (newLeft < 0)
				newLeft = 0;
			if (newLeft >= documentWidth - activeWindowWidth)
				newLeft = documentWidth - activeWindowWidth;
			if (newTop < 0)
				newTop = 0;
			if (newTop >= documentHeight - activeWindowHeight)
				newTop = documentHeight - activeWindowHeight;

			//Set the new window position
			$ActiveWindow.css("left", newLeft);
			$ActiveWindow.css("top", newTop);
			
			if(bAnimatingWindowFlash)
				$(".windowBackgroundShadow").remove();
		}
		//Check if the window is being resized
		else if (bResizeWindow)
		{
			//Get the border size
			var options = $ActiveWindow.data("options");
			var windowBorderSize = options.borderSize;
			
			//Get the resize dimensions
			var $divResize = $("#divResize");
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
			var strCursor = $divResize.css("cursor");
			if (strCursor === "e-resize")
			{
				resizeWidth += (e.pageX - lastMouseCoords.x);
			}
			else if (strCursor === "w-resize")
			{
				resizeWidth -= (e.pageX - lastMouseCoords.x);
				resizeLeft += (e.pageX - lastMouseCoords.x);
				bMoveLeft = true;
			}
			else if (strCursor === "s-resize")
			{
				resizeHeight += (e.pageY - lastMouseCoords.y);
			}
			else if (strCursor === "n-resize")
			{
				resizeHeight -= (e.pageY - lastMouseCoords.y);
				resizeTop += (e.pageY - lastMouseCoords.y);
				bMoveUp = true;
			}
			else if (strCursor === "se-resize")
			{
				resizeWidth += (e.pageX - lastMouseCoords.x);
				resizeHeight += (e.pageY - lastMouseCoords.y);
			}
			else if (strCursor === "ne-resize")
			{
				resizeWidth += (e.pageX - lastMouseCoords.x);
				resizeHeight -= (e.pageY - lastMouseCoords.y);
				resizeTop += (e.pageY - lastMouseCoords.y);
				bMoveUp = true;
			}
			else if (strCursor === "sw-resize")
			{
				resizeWidth -= (e.pageX - lastMouseCoords.x);
				resizeLeft += (e.pageX - lastMouseCoords.x);
				resizeHeight += (e.pageY - lastMouseCoords.y);
				bMoveLeft = true;
			}
			else if (strCursor === "nw-resize")
			{
				resizeWidth -= (e.pageX - lastMouseCoords.x);
				resizeLeft += (e.pageX - lastMouseCoords.x);
				resizeHeight -= (e.pageY - lastMouseCoords.y);
				resizeTop += (e.pageY - lastMouseCoords.y);
				bMoveLeft = true;
				bMoveUp = true;
			}

			//Get document dimensions
			var documentWidth = $(document).width();
			var documentHeight = $(document).height();
			
			//Constrain the window to the document on the left side
			if (resizeLeft < 0 && bMoveLeft)
			{
				resizeLeft = $("#divResize").offset().left;
				resizeWidth = $("#divResize").width();
			}
			
			//Constrain the window to the document on the right side
			if (resizeLeft >= documentWidth - resizeWidth - windowBorderSize * 3 && !bMoveLeft)
			{
				resizeWidth = $("#divResize").width();
				resizeLeft = $("#divResize").offset().left;
			}

			//Constrain the window to the document on the top side
			if (resizeTop < 0 && bMoveUp)
			{
				resizeTop = $("#divResize").offset().top;
				resizeHeight = $("#divResize").height();
			}
			
			//Constrain the window to the document on the bottom side
			if (resizeTop >= documentHeight - resizeHeight - windowBorderSize * 3 && !bMoveUp)
			{
				resizeHeight = $("#divResize").height();
				resizeTop = $("#divResize").offset().top;
			}
			
			//Make sure the resize width is greater then the minimum width
			if(resizeWidth < options.minWidth - windowBorderSize)
			{		
				if(bMoveLeft)
					resizeLeft = resizeRight - (options.minWidth - windowBorderSize);
				else
					resizeLeft = resizeOffset.left;
				resizeWidth = options.minWidth - windowBorderSize;				
			}
			
			//Make sure the resize height is greater then the minimum height
			if(resizeHeight < options.minHeight + windowBorderSize)
			{
				if(bMoveUp)				
					resizeTop = resizeBottom - (options.minHeight + windowBorderSize);
				else
					resizeTop = resizeOffset.top;
					
				resizeHeight = options.minHeight + windowBorderSize;
			}
				
			//Set the size and position of the resize div
			$("#divResize")
				.width(resizeWidth)
				.height(resizeHeight)
				.css("left", resizeLeft + "px")
				.css("top", resizeTop + "px");
		}
		
		//record the last mouse coordinates
		lastMouseCoords = { x: e.pageX, y: e.pageY };
	}
	
	//Content event for mouse down
	function ContentMouseDown(e)
	{
		var $parentWindow = $(this).closest(".window");
		
		//Set the active window
		SetActiveWindow($parentWindow);
		
		//Stop propagation
		e.stopImmediatePropagation();	
	}
	
	function DragItemDown(e)
	{
		//If it's not docked then start the dragging process
		if (!$ActiveWindow.data("docked"))
			bDraggingWindow = true;		
			
		//Disable selection
		$(document).on("selectstart", DisableWrap);
	}
	
	//Div window event for mouse down (user starts resizing)
	function WindowMouseDown(e)
	{
		//Set flag to indicate window is resizing
		bResizeWindow = true;

		//Set the active window
		SetActiveWindow($(this));

		//Disable selection
		$(document).on("selectstart", DisableWrap);
		
		//Get the border size for the window
		var windowBorderSize = $ActiveWindow.data("options").borderSize;
		
		//Set the divResize match the size and location of the window
		$("#divResize")
			.width($ActiveWindow.width() - windowBorderSize)
			.height($ActiveWindow.height() - windowBorderSize)
			.css("left", ($ActiveWindow.offset().left - windowBorderSize) + "px")
			.css("top", ($ActiveWindow.offset().top - windowBorderSize) + "px")
			.css("cursor", $ActiveWindow.css("cursor"))
			.css("z-index", $zIndexArray.length + 1)
			.show();
	}
	
	//Div window event for mouse move (mouse is hovering of resize border)
	function WindowMouseMove(e)
	{
		//Make sure the mouse over document is the window
		if (document.elementFromPoint(e.pageX, e.pageY).className == "window")
		{
			var $this = $(this);
			var windowBorderSize = $this.data("options").borderSize;
		
			//Calculate the middle of the window
			var halfWidth = $this.width() / 2;
			var halfHeight = $this.height() / 2;

			//For firefox get the local mouse coordinates
			if (e.offsetX == undefined)
			{
				var offset = $this.offset();
				e.offsetX = e.pageX - offset.left;
				e.offsetY = e.pageY - offset.top;
			}

			//North and south resize
			if (e.offsetX > windowBorderSize && e.offsetX < $this.width() - windowBorderSize)
			{
				if (e.offsetY <= windowBorderSize)
					$this.css("cursor", "n-resize");
				else
					$this.css("cursor", "s-resize");
			}
			//NE Corner
			else if (e.offsetX >= halfWidth && e.offsetY <= windowBorderSize)
				$this.css("cursor", "ne-resize");
			//SE Corner
			else if (e.offsetX >= halfWidth && e.offsetY >= $this.height() - windowBorderSize)
				$this.css("cursor", "se-resize");
			//NW Corner
			else if (e.offsetX < halfWidth && e.offsetY <= windowBorderSize)
				$this.css("cursor", "nw-resize");
			//SW Corner
			else if (e.offsetX < halfWidth && e.offsetY >= $this.height() - windowBorderSize)
				$this.css("cursor", "sw-resize");
			//E-W resize
			else if (e.offsetX >= halfWidth)
				$this.css("cursor", "e-resize");
			else
			//W resize
				$this.css("cursor", "w-resize");
		}
	}
	
	//Bind a resize event for when a window resizes -- Designed for the contentTiles.js plugin
	function SetOnWindowResizeEvent($window, functionCallback)
	{
		if($window.attr('class') != "window")
			$window = GetWindow($window);
			
		$window.data("ResizeEventCallback", functionCallback);
	}
})();