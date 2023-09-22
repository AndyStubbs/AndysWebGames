/* global WindowFactory */
var Notepad = (function () {
    
    var publicAPI = {
        start: start
    };
    
    return publicAPI;
    
    var $notepad;
    
    function start()
    {
        $notepad = WindowFactory.CreateWindow({
    		headerContent: "Notepad - Untitled", 
    		bodyContent: "<div contenteditable='true' class='npEditor'></div>", 
    		footerContent: "<div class='npFooter'></div>",
    		toolbarContent: "<div class='npToolBar'><input type='button' class='npToolBarButton npToolBarButtonSave' /></div>",
    		headerHeight: 31,
    		footerHeight: 18,
    		toolbarHeight: 41,
    		left: 275,
    		top: 250,
    		width: 500,
    		height: 350,
    		bFolder: false,
    		icon: "url(img/icon_notebook.png)",
    		name: "Untitled"
    	});
    	
    	$notepad.find(".windowBody").css("background-color", "white");
    	$notepad.find(".npEditor").css("min-height", $notepad.find(".windowBody").height() - 10);
    	WindowFactory.SetOnWindowResizeEvent($notepad, function () {
    	    $notepad.find(".npEditor").css("min-height", $notepad.find(".windowBody").height() - 10);
    	});
    }
   
})();