"use strict";

var Help = ( function () {

	var publicAPI, helpData, response;

	publicAPI = {
		"start": start
	};

	helpData = [
		{
			"name": "overview",
			"title": "Overview",
			"body": "" +
				"<p>" +
					"This website is a virtual operating system with folders, files, apps, and " +
					" a taskbar. You can interact with the page by using the mouse and keyboard. " +
					" There is minimal support for mobile because it wasn't designed with mobile" +
					" in mind. So not everything is working for mobile devices and tablets." +
				"</p>" +
				"<p>" +
					"You can drag and drop the files to move them around. The files will be auto " +
					"aligned in a grid system on the desktop or into folders. " +
				"</p>" +
				"<p>" +
					"Double click on the files or folders to open them. " +
					"When you open a file or folder it will be opened in a window. The windows " +
					"can be minimized, maximized or resized." +
				"</p>" +
				"<p>" +
					"Right click will bring up the context menu. Which will open up various menus" +
					" depending on where you right-clicked. See Context Menu section for more " +
					"information." +
				"</p>"
		},
		{
			"name": "console",
			"title": "Console",
			"body": "" +
				"<p>The console app allows you to manage the files by entering commands. For a " +
				"full list of commands open the console and type help. The commands are " +
				"similar to windows and linux commands. </p>" +
				"<p>When you list out the files and folders with a dir or ls command you can " +
				"click on the links inside the console to open them.</p>" +
				"<p>The console app can be opened from the context menu if you right on the " +
				"desktop or a folder. The directory that was right-clicked will be set as the " +
				"starting directory automatically.</p>"
		},
		{
			"name": "files",
			"title": "Files",
			"body": "<p>Files all preform an action when you double click on them or type them in" +
				"the console app. The action they take will depend on the type of the file.</p>" +
				"<p>The types of files are: script, picture, link, folder, text, video, data.</p>" +
				"<p><b>Script</b> - This file will run the files data as a command. Scripts are " +
				"convenient wayst to run apps.</p>" +
				"<p>" +
					"<b>Picture</b> - This file will open an image inside of a window. Pictures " +
					"can contain either url's to a picture or a picture that was " +
					"previously imported. Once created this pictures can be used as the " +
					"background image of this website." +
				"</p>" +
				"<p>" +
					"<b>Link</b> - This file will open a new link to a website in a new browser " +
					"tab." +
				"</p>" +
				"<p><b>Folder</b> - A folder is a file that contains other files or folders.</p>" +
				"<p><b>Text</b> - A text file is a file that contains text data. This is good for" +
				" making notes.</p>" +
				"<p>" +
					"<b>Video</b> - A video file will open in a window with an iframe to an " +
					" embeded video. This will work with most video sites such as Youtube, " +
					"Bitchute, and Rumble that support embedded videos. Most sites have a " +
					"special links for embedded videos. For Youtube videos this site will " +
					"automatically convert it to the embedded link." +
				"</p>" +
				"<p>" +
					"<b>Data</b> - Data files are used by apps to store information related to the" +
					" app. Currently the only app using data files is the Channel Tracker. " +
				"</p>"
		},
		{
			"name": "context",
			"title": "Context Menu",
			"body": "<p>Right click on the desktop, files, and folders to bring up the context " +
				"menu. The context menu will be different for depending on what you right click " +
				"on.</p>" +
				"<p><b>Settings</b> - If you right click on the desktop you can bring up the " +
				"settings menu. This will allow you to change the desktop background including" +
				" adding a background image.</p>" +
				"<p><b>Open Console</b> - This will open the console app and set the default " +
				"directory to the folder that was right-clicked.</p>" +
				"<p><b>New File</b> - This will open up the file dialog and allow you to " +
				"create a new file of any type.</p>" +
				"<p><b>File Options</b> - Right click on a file and you will get the option to " +
				"open, edit, cut, copy, or delete the file.</p>" +
				"<p><b>Picture Options</b> - Right click on a picture file and you will get " +
				"the option to 'Set as Background'. This will open up the settings app with " +
				"picture set as the background.</p>"
		},
		{
			"name": "import",
			"title": "Import Files",
			"body": "<p>You can import files by dragging and dropping them from your local " +
				"computer and onto this site. You can drag images, text files, and bookmarks. " +
				"When you import a bookmark it will automatically set the file type as a link." +
				" See the help section on localstorage for more information on how imported" +
				"data is stored and storage limitations.</p>" +
				"<p>Images that get imported don't automatically get created as a file. But " +
				"you can add them as file in the file dialog by clicking on the select image " +
				"button. The create file button on the import dialog will automatically " +
				"open up the file dialog with the image selected.</p><p>Click the cancel " +
				"button to cancel the import</p>"
		},
		{
			"name": "settings",
			"title": "Settings",
			"body": "<p>The settings app allows you to change the background, control your data, " +
				" and manage your upload data.<p>" +
				"<p><b>Background</b> - This tab allows you to set the background image, color, " +
				"icon text color, icon highlight color. </p>" +
				"<p>There are different background display " +
				"options: contain, cover, centered, and tiled. Contain makes sure that the image " +
				"is displayed as large as possible without cropping or stretching. Cover sets " +
				"the image to stretch to fill the entire background and will most likely crop " +
				"the image as a result. Centered puts the image into the center and keeps its " +
				"normal size. Tiled images will show the image in columns and rows to cover the " +
				"screen. Any transparent areas of the images will show up as the background " +
				"color. </p><p>You can select solid color if you don't want a background" +
				" image.</p>" +
				"<p><b>Control</b> - The control tab allows you to reset your data, download, or " +
				"upload your workspace data. You can use this to migrate your workspace between " +
				"different computers or different browsers on the same computer.</p>" +
				"<p><b>Uploads</b> - The uploads tab allows you to delete uploaded images. If " +
				"you run out of space in your localstorage this is where you would go to free " +
				"up some space.</p>"
		},
		{
			"name": "tracker",
			"title": "Channel Tracker",
			"body": "<p>Channel Tracker is an app that allows you to track and watch videos from" +
				" Youtube and Bitchute channels. You have to find the channel link and " +
				"enter it into the channel tracker. You can sort your channels by category and " +
				"either watch the videos in the tracker, in a seperate windows, or save them " +
				"to a file and watch them later.</p>" +
				"<p><b>View Channels</b> - In this tab you can find all of the recent videos " +
				"posted by the channels you have added. The videos are sorted chronologically " +
				"and filtered by categories. You can select your filters by clicking on them " +
				"at the top of the tab." +
				"<p>" +
					"<b>Add Channel</b> - This tab allows you to add new channels. To add a " +
					"new channel you can enter the url to the channel or to the rss feed. " +
					"If you enter a link to the channel page the Channel Tracker will " +
					"automatically convert the link to the rss feed url." +
					"If you just enter a channel id/name the Channel Tracker will convert it " +
					"to a youtube channel feed url by deafult. For Bitchute you must enter the " +
					"full url to the channel or rss feed." +
				"</p>" +
				"<p>Bitchute feed link format: " +
					"<i>https://www.bitchute.com/feeds/rss/channel/CHANNEL_NAME</i>.</p>" +
				"<p>Youtube feed link format: " + 
					"<i>https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_NAME</i>.</p>" +
				"<p>Replace <i>CHANNEL_NAME</i> in the above links to the channel name you want " +
				"to track to add them to your list of channels. </p>" +
				"<p>You must select a category for each channel you add.</p>" +
				"<p><b>Settings</b> - The settings tab allows you to manage your channels and " +
				"categories.</p>" +
				"<p>" +
					"<b>Data File</b> - The Channel Tracker uses a data file to store " +
					"all the settings for the Channel Tracker." +
					" It will look for the data file in the /Apps/Data folder by default. " +
					" If the data file is not found it will create a new one in the same " +
					"folder that Channel Tracker is located. To change the data file that the " +
					"Channel Tracker is using you have to edit the Channel Tracker script file " +
					"and change or add a parameter to point it to a data file. For example: " +
					"start:rss-reader \"/Apps/Data/Tracker Settings\". The data file in this " +
					"example is /Apps/Data/Tracker Settings. The folder needs quotes around" +
					" the path because the file name contains a space." +
				"</p>"
		},
		{
			"name": "localstorage",
			"title": "Localstorage",
			"body": "<p>Local storage is a way of storing your data in the browser so that any " +
				"changes you make to your os will remain when you come back to this page. The " +
				"changes will stay even when you refresh the page. Local storage size is about " +
				"10 MB on average depending on the browser. This is enough data to save your " +
				" 100's of files and links. Imported images will take up much more of this space " +
				" so you should be careful about loading too many images. </p>"
		}
	];

	helpData.sort( function ( a, b ) {
		if( a.name === "overview" ) {
			return -1;
		} else if( b.name === "overview" ) {
			return 1;
		} else {
			if( a.title < b.title ) {
				return -1;
			} else {
				return 1;
			}
		}
	} );

	return publicAPI;

	function start( params, process ) {
		var $help, contents, isResizing, indexContents, i;

		if( params.length > 1 ) {
			
		}

		isResizing = false;
		indexContents = "";

		indexContents += "<div style='border-bottom: 1px solid black;' data-category='" +
			helpData[ 0 ].name + "'>" + helpData[ 0 ].title + "</div>";
		for( i = 1; i < helpData.length; i++ ) {
			indexContents += "<div data-category='" + helpData[ i ].name + "'>" +
				helpData[ i ].title + "</div>";
		}

		contents = "" +
			"<div class='help-frame'>" +
				"<div class='help-index'>" +
					indexContents +
				"</div>" +
				"<div class='help-border'>" +
				"</div>" +
				"<div class='help-body'>" +
				"</div>" +
			"</div>";

		$help = WindowFactory.CreateWindow( {
			headerContent: "Help",
			bodyContent: contents,
			footerContent: "",
			toolbarContent: "",
			headerHeight: 31,
			footerHeight: 0,
			toolbarHeight: 0,
			width: 600,
			height: 450,
			isFolder: false,
			icon: "url(data/img/icons/help.png)",
			name: "Help"
		} );

		$help.find( ".help-index > div" ).on( "click", function () {
			var name, i;
			name = this.dataset.category;
			$help.find( ".selected" ).removeClass( "selected" );
			$( this ).addClass( "selected" );
			for( i = 0; i < helpData.length; i++ ) {
				if( helpData[ i ].name === name ) {
					break;
				}
			}
			$help.find( ".help-body" ).html(
				"<div>" +
					"<h2>" + helpData[ i ].title + "</h2>" +
					"<div>" + helpData[ i ].body + "</div>" +
				"</div>"
			);
		} );

		$help.find( ".help-frame" ).on( "mousedown", function ( e ) {
			var $hover;

			$hover = $( document.elementFromPoint( e.pageX, e.pageY ) );
			if( $hover.hasClass( "help-border" ) ) {
				isResizing = true;
			}
		} );

		$help.find( ".help-frame" ).on( "mousemove", function ( e ) {
			var width, $helpFrame, pos, midPoint;

			if( isResizing ) {
				$helpFrame = $help.find( ".help-frame" );
				width = $helpFrame.width();
				pos = $helpFrame.offset();
				midPoint = e.pageX - pos.left - 1.5;
				if( midPoint < 100 ) {
					midPoint = 100;
				}
				if( midPoint > width - 200 ) {
					midPoint = width - 200;
				}
				$help.find( ".help-index" ).width( midPoint );
				$help.find( ".help-body" )
					.css( "width", "calc(100% - " + ( midPoint + 3 ) + "px)" );
			}
		} );

		$( document.body ).on( "mouseup", function ( e ) {
			isResizing = false;
		} );

		$help.find( ".help-index > div" ).first().trigger( "click" );
	}

} )();

Command.AddProgram(
	"helpapp", "Help", Help.start, "url(data/img/icons/help.png)",
	"Documation for this sites apps and features."
);
