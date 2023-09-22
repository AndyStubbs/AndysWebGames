/* global FileSystem */
var IconFactory = (function () {
    
    var $dragIcon;
    var lastMouseCoords;
    var gridSize = {
    	width: 50,
    	height: 50
    };
    var count = 0;
    var $divIconPlaceholder;
    var $divIconPlaceholder2;
    
   	var isDragging = false;
   	var $cancelDragWindow;
   	
    //Provides access to methods in the WindowsFactory
	var publicAPI = {
		CreateIcon: CreateIcon,
		Init: Init
	};
	
	return publicAPI;
	
	function Init()
	{
		$(document).on("mousedown", ".divIcon", IconMouseDown);
		$(document).on("mousemove", IconMouseMove);
		$(document).on("mouseup", IconMouseUp);
		$divIconPlaceholder = $("<div class='divIcon divIconPlaceHolder'>");
		$divIconPlaceholder2 = $("<div class='divIcon divIconPlaceHolder'>");
	}
	
	function CreateIcon($folderWindow, p_options)
	{
	    var defaults = {
	        iconSize: $folderWindow.data("iconSize"),
	        image: "url(img/icon_default.png)",
	        name: count++,
	        dblClick: function () {  }
	    };
	    
	    //Set the default values but options will override
		var options = $.extend({}, defaults, p_options);
	
		var $icon = $("<div class='divIcon'><span>" + options.name + "</span></div>");
		$icon.on("dblclick", options.dblClick);
		$icon.data("options", options);
		
		//Set the icon size
		$icon.width(options.iconSize.width + 5);
		$icon.height(options.iconSize.height + 5);	
		
		//Set the icon image
		$icon.css("background", options.image + "no-repeat center");		
		
		//Click event
		//$icon.on("click", function () {alert("hi");});
		
		if($folderWindow[0] === document.body)
		{
			$folderWindow.append($icon);
		}
		else
		{
			$folderWindow.find(".windowBody").append($icon);
		}
		
		return $icon;
	}
	
	function IconMouseDown(e)
	{
		$dragIcon = $(this).closest(".divIcon");
		HighlightIcon($dragIcon);
	//	var t = (new Date()).getTime();
	//	if($lastClicked[0] === $dragIcon[0] && t - dblClickTime < dblClickDelay)
	//	{
	//		//alert("double");
	//		$dragIcon = false;
	//	}
	//	else
	//	{
			
	//	}
	//	$lastClicked = $dragIcon;
	//	dblClickTime = t;
	}
	
	function StartDrag(e)
	{
		$divIconPlaceholder.width($dragIcon.width());
		$divIconPlaceholder.height($dragIcon.height());
		$divIconPlaceholder.css("background-color", "RGBA(128,128,128,0.2)");
		$divIconPlaceholder2.width($dragIcon.width());
		$divIconPlaceholder2.height($dragIcon.height());
		$dragIcon.before($divIconPlaceholder);
		$dragIcon.css("position", "absolute");
		$dragIcon.css("zIndex", 10000);
		
		var position = $dragIcon.offset();
		
		$cancelDragWindow = $dragIcon.parent();
		$(document.body).append($dragIcon);
		$dragIcon.css("left", e.pageX - $dragIcon.width() / 2);
		$dragIcon.css("top", e.pageY - $dragIcon.height() / 2);
		
		console.log("StartDrag");
		console.log($cancelDragWindow);
	}
	
	function IconMouseMove(e)
	{
		if($dragIcon && isDragging)
		{
			$dragIcon.css("background-color", "");
			
			//Get the size of the document
			var $document = $(document);
			var documentWidth = $document.width();
			var documentHeight = $document.height();
			
			//Get the size and position of the window
			var activeWindowWidth = $dragIcon.width();
			var activeWindowHeight = $dragIcon.height();
			var offset = $dragIcon.offset();
			
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
			$dragIcon.css("left", newLeft);
			$dragIcon.css("top", newTop);
			
			$dragIcon.hide();
			var $dropLocation = $(document.elementFromPoint(e.pageX, e.pageY));
			if($dropLocation.hasClass("divIcon") && !$dropLocation.hasClass("divIconPlaceHolder"))
			{
				PlaceOnWindow($divIconPlaceholder, e);
			}
			else if(!$dropLocation.hasClass("divIconPlaceHolder"))
			{
				$divIconPlaceholder.remove();
			}
			$dragIcon.show();
		}
		else if($dragIcon && (lastMouseCoords.x !== e.pageX || lastMouseCoords.y !== e.pageY))
		{
			isDragging = true;
			StartDrag(e);
		}
		lastMouseCoords = { x: e.pageX, y: e.pageY };
	}
	
	function IconMouseUp(e)
	{
		if($dragIcon && isDragging)
		{
			$divIconPlaceholder.remove();
			var $dragIconAninmation = $dragIcon;
			$dragIcon.hide();
			var path = PlaceOnWindow($divIconPlaceholder2, e);
			$dragIcon.show();
			
			var destOffset = $divIconPlaceholder2.offset();
			var srcOffset = $dragIcon.offset();
			var dx = destOffset.left - srcOffset.left;
			var dy = destOffset.top - srcOffset.top;
			var d = Math.sqrt(dx * dx + dy * dy);
			var animDuration = Math.round(d / 3) + 100;
			
			$dragIcon.animate({
				left: destOffset.left,
				top: destOffset.top
			}, animDuration, function () {
				$divIconPlaceholder2.after($dragIconAninmation);
				$dragIconAninmation.css("position", "static");
				$dragIconAninmation.css("display", "inline-block");
				$divIconPlaceholder2.remove();
				HighlightIcon($dragIconAninmation);
				//PlaceOnWindow($dragIconAninmation, e);
			});
			
			var options = $dragIcon.data("options");
			var oldPath = options.path;
			options.path = path;		
			if(path !== oldPath)
			{
				FileSystem.moveFile(path, oldPath + "/" + options.name);
			}
		}
		$dragIcon = false;
		isDragging = false;
	}
	
	function PlaceOnWindow($icon, e)
	{
		var offset = $dragIcon.offset();
		$icon.hide();
		var $dropLocation = $(document.elementFromPoint(e.pageX, e.pageY));
		var $after = false;
		var $before = false;
		if($dropLocation.hasClass("divIcon"))
		{
			if(offset.left >= $dropLocation.offset().left)
				$after = $dropLocation;
			else
				$before = $dropLocation;
		}
			
		var $parentWindow = $dropLocation.closest(".window");
		var path = "";
		if($parentWindow.length === 0)
		{
			$parentWindow = $(document.body);
			path = "root";
		}
		else
		{			
			var options = $parentWindow.data("options");
			path = options.path;
			if(options.bFolder)
			{
				//Check to make sure that we are not moving a folder into itself
				var optionsSource;
				if($cancelDragWindow[0] === document.body)
					optionsSource = $cancelDragWindow.data("options");
				else
					optionsSource = $cancelDragWindow.closest(".window").data("options");
					
				if(options.path.indexOf(optionsSource.path + "/" + $dragIcon.data("options").name) === 0)
				{
					$parentWindow = $cancelDragWindow;
				}
				else
				{
					$parentWindow = $parentWindow.find(".windowBody");
				}
			}
			else
			{
				$parentWindow = $cancelDragWindow;
			}
		}
		
		//var parentOffset = $parentWindow.parent().offset();
		//var left = offset.left - parentOffset.left;
		//var top = offset.top - parentOffset.top;
		$icon.css("zIndex", $parentWindow.css("zIndex"));
		
		if($parentWindow === $cancelDragWindow)
		{
			$parentWindow.append($icon);
		}
		else
		{
			if($after)
				$after.after($icon);
			else if($before)
				$before.before($icon);
			else
				$parentWindow.append($icon);
		}
		
		$icon.show();
		$icon.css("display", "inline-block");
		//$dragIcon.css("left", left);
		//$dragIcon.css("top", top);
		$icon.css("position", "static");
		
		var position = $icon.position();
		$icon.css("top", position.top);
		$icon.css("left", position.left);
		
		//console.log("PlaceOnWindow");
		//console.log($parentWindow);
		
		return path;
	}
	
	function HighlightIcon($icon)
	{
		$(".divIcon").css("background-color", "");
	//	alert($icon.parent().css("background-color"));
		var color = $icon.parent().data("highlightColor");
		$icon.css("background-color", color);
	}
})();
