"use strict";

$( document ).ready( function () {

	WindowFactory.Init();
	IconFactory.Init();
	FileSystem.Init();

} );

var Program = ( function () {

//Provides access to methods in the WindowsFactory
var publicAPI = {
	"Start": Start,
	"RefreshFolders": RefreshFolders,
	"CreateFileDialog": CreateFileDialog,
	"CreateSetBackgroundImageDialog": CreateSetBackgroundImageDialog
};

return publicAPI;

function Start( isNewSystem ) {
	var tempFile;

	Command.AddCommand( "folder", openFolderCommand );
	Command.AddCommand( "view", viewImageCommand );
	Command.AddCommand( "watch", watchVideoCommand );
	Command.AddCommand( "link", openLinkCommand );
	Command.AddCommand( "save", saveFileCommand );

	openFolder( "/", $( "#main" ) );
	UpdateBackground();

	if( isNewSystem ) {
		tempFile = {
			"type": "script",
			"data":  "start:about",
			"parent": "/",
			"path": "/",
			"icon": "url(data/img/icons/about.png)"
		};
		Command.Execute( tempFile );
	}
}

function RefreshFolders( skipFolderUi ) {
	var openWindows, i, options, file;

	openWindows = WindowFactory.GetOpenWindows();
	for( i = 0; i < openWindows.length; i++ ) {
		options = openWindows[ i ].$window.data( "options" );
		if( options.isFolder ) {

			// Get the folder file - Don't want to log error if file not found
			Util.toggleLogging( false );
			file = FileSystem.getFile( options.id );
			Util.toggleLogging( true );

			// If file is deleted then close the window
			if( ! file ) {
				WindowFactory.CloseWindow( openWindows[ i ].$window );
				continue;
			}

			RefreshFolderHeader( openWindows[ i ].$window );

			// Skip folder update if currently moving file into folder
			if( ! skipFolderUi ) {

				// Remove all icons from window
				openWindows[ i ].$window.find( ".windowBody" ).html( "" );

				// Recreate all icons in folder
				openFolder( file.path, openWindows[ i ].$window );

			}

		}
	}

	// Refresh root
	if( ! skipFolderUi ) {
		$( "#main > .icon" ).remove();
		openFolder( "/", $( "#main" ) );
	}

}

function openFolder( path, $folder ) {
	var files, i, file, isLink;

	files = FileSystem.getFolder( path );

	if( ! files || ! Array.isArray( files ) ) {
		Util.log( "Error: Folder not found " + path );
		return false;
	}

	for( i = 0; i < files.length; i++ ) {
		file = files[ i ];
		isLink = file.type === "link";
		IconFactory.CreateIcon( $folder, {
			"image": file.icon, 
			"name": file.name,
			"id": file.id,
			"dblClick": setExecuteCommand( files[ i ] )
		}, isLink );
	}
}

function setExecuteCommand( fileData ) {
	return function () {
		Command.Execute( fileData );
	}
}

function openFolderCommand( params, process ) {
	var path, name, openWindows, windowAlreadyOpen, index, i, $folder, file, folderId;

	if( params.length < 2 ) {
		file = process.getFile( process.getPath() );
	} else {
		file = process.getFile( params[ 1 ] );
	}

	if( file === false ) {
		return false;
	}

	if( file.isRoot ) {
		Util.log( "Error: cannot open root as folder." );
		return false;
	}

	if( ! file ) {
		Util.log( "Error: Folder not found " + params[ 1 ] + "." );
		return false;
	}

	folderId = file.id;
	path = file.path;
	name = file.name;
	openWindows = WindowFactory.GetOpenWindows();
	windowAlreadyOpen = false;
	index = -1;
	for( i = 0; i < openWindows.length; i++ ) {
		if( openWindows[ i ].$window.data( "options" ).id === folderId ) {
			windowAlreadyOpen = true;
			index = i;
			break;
		}
	}

	if( windowAlreadyOpen ) {
		WindowFactory.IconButtonClick.call( openWindows[ index ].$icon );
	} else {
		$folder = WindowFactory.CreateWindow( {
			"headerContent": path, 
			"bodyContent": "", 
			"footerContent": "",
			"headerHeight": 31,
			"footerHeight": 0,
			"width": 500,
			"height": 360,
			"isFolder": true,
			"path": path,
			"icon": "url(data/img/icons/folder.png)",
			"name": name,
			"id": folderId
		} );
		openFolder( path, $folder );
		WindowFactory.SetOnWindowResizeEvent( $folder, function () {
			RefreshFolderHeader( $folder );
		} );
	}
}

function RefreshFolderHeader( $folder ) {

	// Make sure that the header text fits as best as possible on the window
	var folderId, $windowHeader, $windowButtons, $headerSpan, maxWidth, headerText, parts, i;

	folderId = $folder.data( "options" ).id;
	$windowHeader = $folder.find( ".windowHeader" );
	$windowButtons = $folder.find( ".windowButtons" );
	$headerSpan = $folder.find( ".windowHeader span" );

	// Update the path from the filedata
	$headerSpan.html( FileSystem.getFile( folderId ).path );

	maxWidth = $windowHeader.width() - $windowButtons.width() - 1;
	if( $headerSpan.width() >= maxWidth ) {
		headerText = $headerSpan.text().trim();
		parts = headerText.split( "/" );
		if( parts.length < 2 ) {
			return;
		}
		for( i = 1; i < parts.length; i++ ) {
			$headerSpan.html(
				"../" + headerText.substring( headerText.indexOf( parts[ i ] ) )
			);
			if( $headerSpan.width() < maxWidth ) {
				return;
			}
		}
	}
}

function viewImageCommand( params ) {
	var img, file, name, $image;

	if( params.length > 1 ) {
		file = FileSystem.getFile( params[ 1 ] );
		img = file.data;
		name = file.name;
	} else {
		img = "";
		name = "";
	}

	$image = WindowFactory.CreateWindow( {
		"headerContent": "Image Viewer - " + name,
		"bodyContent": "<div class='img-view'><img src='" + img + "' /></div>",
		"footerContent": "",
		"headerHeight": 31,
		"footerHeight": 0,
		"width": 500,
		"height": 350,
		"isFolder": false,
		"icon": "url(data/img/icons/photo.png)",
		"name": name
	} );

	WindowFactory.SetOnWindowResizeEvent( $image, resizeImage );

	$image.find( ".img-view img" )[ 0 ].onload = resizeImage;
	//resizeImage();
	function resizeImage() {
		var height, containerHeight;

		containerHeight = $image.find( ".windowBody" ).height();
		height = $image.find( ".img-view img" ).height();
		$image.find( ".img-view" ).css( "margin-top",
			( containerHeight - height ) / 2
		);
	}
}

function watchVideoCommand( params, process ) {
	var videoFile, videoSrc, videoName, $video, start, end, temp;

	if( params.length > 1 ) {
		if( params[ 1 ].indexOf( "~~link~~" ) > -1 ) {
			temp = params[ 1 ].replace( /\"/g, "" );
			start = temp.indexOf( "~~link~~" ) + 8;
			end = temp.indexOf( "~~title~~" );
			videoSrc = Util.parseVideoUrl( temp.substring( start, end ) );
			videoName = temp.substring( end + 9 );
		} else {
			videoFile = FileSystem.getFile( params[ 1 ] );
			videoSrc = Util.parseVideoUrl( videoFile.data );
			videoName = videoFile.name;
		}
	} else {
		videoSrc = "";
	}

	$video = WindowFactory.CreateWindow( {
		"headerContent": "Video Viewer - " + videoName,
		"bodyContent": "<div class='video-view'><iframe src='" + videoSrc + "'></iframe></div>",
		"footerContent": "",
		"headerHeight": 31,
		"footerHeight": 0,
		"width": 500,
		"height": 350,
		"isFolder": false,
		"icon": "url(data/img/icons/video.png)",
		"name": videoName
	} );

	WindowFactory.SetOnWindowResizeEvent( $video, resizeVideo );

	resizeVideo();
	function resizeVideo() {
		$video.find( "iframe" )
			.css( "width", $video.width() - 10 )
			.css( "height", $video.height() - 40 );
	}
}

function openLinkCommand( params ) {
	var url, link;

	if( params.length < 2 ) {
		Util.log( "Error: Missing link." );
		return false;
	}

	link = params[ 1 ];
	link = link.replace( /javascript\:/gi, "" );
	if(
		link.indexOf( "http://" ) !== 0 &&
		link.indexOf( "https://" ) !== 0 &&
		link.indexOf( "ftp://" ) !== 0
	) {
		link = "http://" + link;
	}

	try {
		url = new URL( link );
	} catch( ex ) {
		Util.log( ex );
		return false;
	}

	window.open( url.href );
	//window.location = params[ 1 ];
}

function saveFileCommand( params, process ) {
	var file;
	if( params.length < 2 ) {
		Util.log( "Missing filename." );
		return false;
	}

	file = process.getFile( params[ 1 ] );
	if( ! file ) {
		return false;
	}

	return CreateFileDialog(
		file.parent.path, file.name, file.type, file.data, undefined, "edit", file
	);
}

function CreateFileDialog( path, filename, filetype, data, pos, dialogType, oldfile, okCallback ) {
	var $dialog, contents, fileTypesContent, fileTypes, i, input, process, icon, iconStr, header,
		isIconSet, $iconSelDialog, $imageSelDialog, $programSelDialog;

	if( ! dialogType ) {
		dialogType === "new";
	}

	if( ! filetype ) {
		filetype = "";
	}
	if( ! data ) {
		data = "";
	}

	if( ! pos || ! pos.top || ! pos.left ) {
		pos = {
			"left": 250,
			"top": 150
		};
	}

	fileTypesContent = "";
	fileTypes = Command.GetFileTypes();
	for( i = 0; i < fileTypes.length; i++ ) {
		fileTypesContent += "<option value='" + fileTypes[ i ] + "'";
		if( fileTypes[ i ] === filetype ) {
			fileTypesContent += " selected";
		}
		fileTypesContent += ">" + fileTypes[ i ] + "</option>";
	}

	isIconSet = false;
	if( oldfile ) {
		icon = oldfile.icon;
		iconStr = icon.replace( "url(", "" );
		iconStr = iconStr.substring( 0, iconStr.length - 1 );
		isIconSet = true;
	} else if( filetype !== "" ) {
		icon = Command.GetDefaultIcon( filetype );
		iconStr = icon.replace( "url(", "" );
		iconStr = iconStr.substring( 0, iconStr.length - 1 );
	} else {
		icon = "url(data/img/icons/photo.png)";
		iconStr = "data/img/icons/photo.png";
	}

	// Create the dialog contents
	contents = "" +
		"<div class='file-dialog'>" +
			"<div class='filename'>" +
				"<label>Filename:</label>" +
				"<input type='text' value=\"" + filename + "\" />" +
			"</div>" +
			"<div class='filetype'>" +
				"<label>File type:</label>" +
				"<select>" + fileTypesContent + "</select>" +
				"<label class='icon-label'>Icon:</label>" +
				"<img class='file-icon' src='" + iconStr + "' />" +
			"</div>" +
			"<div class='data'>" +
				"<label>Data:</label>" +
				"<input class='select-program' type='button' value='Select Program' style='display: none' />" +
				"<input class='select-image' type='button' value='Select Image' style='display: none' />" +
				"<textarea>" + data + "</textarea>" +
				"<div class='img-link' style='display:none;'>" +
					"<label>Link:</label>" +
					"<input type='text' />" +
				"</div>" +
				"<div class='img-preview'>" +
					"<img />" +
				"</div>" +
			"</div>" +
			"<div class='file-buttons'>" +
				"<div class='message error-message'>&nbsp;</div>" +
				"<input class='file-save' type='button' value='Save' />" +
				"<input class='file-cancel' type='button' value='Cancel' />" +
			"</div>" +
		"</div>";

	if( dialogType === "new" ) {
		header = "Create New File";
	} else if ( dialogType === "edit" ) {
		header = "Edit File: " + filename;
	} else if( dialogType === "save as" ) {
		header = "Save File As";
	}

	// Create the dialog window
	$dialog = WindowFactory.CreateWindow( {
		"headerContent": header,
		"bodyContent": contents, 
		"footerContent": "",
		"headerHeight": 31,
		"footerHeight": 0,
		"left": pos.left,
		"top": pos.top,
		"width": 500,
		"height": 270,
		"minBodyHeight": 170,
		"isFolder": false,
		"path": path,
		"icon": "url(data/img/icons/dialog.png)",
		"name": "Save File"
	} );

	if( filetype === "picture" ) {
		$dialog.find( ".data .img-link input[type='text']" ).val( data );
	}

	// Create a process for saving the data
	process = Command.CreateProcess( FileSystem.getFile( path ), true );

	// Changed the select
	$dialog.find( ".filetype select" ).on( "change", function () {
		var value, disableTextarea;

		disableTextarea = false;
		value = $( this ).val();

		// Folder selected
		if( value === "folder" ) {
			disableTextarea = true;
		}

		$dialog.find( ".data .img-preview" ).hide();
		$dialog.find( ".data textarea" ).hide();
		$dialog.find( ".data .select-program" ).hide();
		$dialog.find( ".data .select-image" ).hide();

		// Program selected
		if( value === "script" ) {
			$dialog.find( ".data textarea" ).show();
			$dialog.find( ".data textarea" ).css( "height", "calc(100% - 35px )" );
			$dialog.find( ".data .select-program" ).show();
		} else if( value === "picture" ) {
			$dialog.find( ".data .select-image" ).show();
			$dialog.find( ".data .img-preview" ).show();
			$dialog.find( ".img-link" ).show();
		} else {
			$dialog.find( ".data textarea" ).show();
			$dialog.find( ".data textarea" ).css( "height", "" );
			$dialog.find( ".data input[type='button']" ).hide();
		}

		if( disableTextarea ) {
			$dialog.find( ".data textarea" ).prop( "disabled", true );
		} else {
			$dialog.find( ".data textarea" ).prop( "disabled", false );
		}

		if ( ! isIconSet ) {
			icon = Command.GetDefaultIcon( value );
			iconStr = icon.replace( "url(", "" );
			iconStr = iconStr.substring( 0, iconStr.length - 1 );
			$dialog.find( ".filetype .file-icon" )[ 0 ].src = iconStr;
		}

	} );

	// Clicked an icon
	$dialog.find( ".filetype .file-icon" ).on( "click", function () {
		var imgPos = $dialog.offset();
		imgPos.left += 100;
		imgPos.top += 25;

		// Check if the image selector is not already opened
		if( ! $iconSelDialog || ! document.contains( $iconSelDialog[ 0 ] ) ) {
			$iconSelDialog = CreateImageSelectorDialog( path, imgPos, iconStr, "Icons",
				function ( imgSrc ) {
					if( imgSrc !== "" ) {
						icon = "url(" + imgSrc + ")";
						iconStr = imgSrc;
						$dialog.find( ".filetype .file-icon" )[ 0 ].src = iconStr;
						isIconSet = true;
					}
				}
			);
		} else {
			WindowFactory.SetActiveWindowFromElement( $iconSelDialog );
		}

	} );

	// Clicked the data button
	$dialog.find( ".data .select-program" ).on( "click", function () {
		var dialogPos, data;

		dialogPos = $dialog.offset();
		dialogPos.left += 100;
		dialogPos.top += 25;
		data = $dialog.find( ".data textarea" ).val();

		// Check if the image selector is not already opened
		if( ! $programSelDialog || ! document.contains( $programSelDialog[ 0 ] ) ) {
			$programSelDialog = CreateProgramSelectorDialog( path, dialogPos, data,
				function ( programText, programIcon ) {
					if( programText !== "" ) {
						$dialog.find( ".data textarea" ).val( "start:" + programText );
					}
					if( programIcon !== "" ) {
						icon = programIcon;
						iconStr = programIcon.replace( "url(", "" );
						iconStr = iconStr.substring( 0, iconStr.length - 1 );
						$dialog.find( ".filetype img" )[ 0 ].src = iconStr;
						isIconSet = true;
					}
				}
			);
		} else {
			WindowFactory.SetActiveWindowFromElement( $programSelDialog );
		}
	} );

	$dialog.find( ".data .select-image" ).on( "click", function () {
		var imgPos;
		
		imgPos = $dialog.offset();
		imgPos.left += 100;
		imgPos.top += 25;

		// Check if the image selector is not already opened
		if( ! $imageSelDialog || ! document.contains( $imageSelDialog[ 0 ] ) ) {
			$imageSelDialog = CreateImageSelectorDialog( path, imgPos, "", "Backgrounds",
				function ( imgSrc ) {
					if( imgSrc !== "" ) {
						$dialog.find( ".img-preview img" )[ 0 ].src = imgSrc;
						$dialog.find( ".data .img-link input[type='text']" ).val( imgSrc );
					}
				}
			);
		} else {
			WindowFactory.SetActiveWindowFromElement( $imageSelDialog );
		}
	} );

	$dialog.find( ".filetype select" ).trigger( "change" );

	// Preselect the filename
	input = $dialog.find( ".filename input" )[ 0 ];
	input.focus();
	input.select();

	// Cancel button
	$dialog.find( ".file-cancel" ).on( "click", function () {
		WindowFactory.CloseWindow( $dialog );
	} );

	// Save button
	$dialog.find( ".file-save" ).on( "click", function () {
		var name, filetype, data, status, response;

		name = input.value;
		filetype = $dialog.find( ".filetype select" ).val();
		data = $dialog.find( ".data textarea" ).val();
		if( filetype === "folder" ) {
			data = "";
		} else if( filetype === "picture" ) {
			data = $dialog.find( ".data .img-link input[type='text']" ).val();
		}
		Util.setLogMode( "string" );
		Util.clearLog();

		// Use different save methods for the various dialog types
		if( dialogType === "new" ) {

			// Save the file do not overwrite existing file if it exists
			status = process.writeFile( name, filetype, data, icon, false );

		}
		// Edit will save the file and then move it if the path changes
		else if( dialogType === "edit" ) {

			status = true;

			// If the name of the file has changed then move the file
			if( name !== oldfile.name ) {
				status = process.moveFile( oldfile, name );
			}

			if( status ) {
				// Save the file and overwrite
				status = process.writeFile( name, filetype, data, icon, true );
			}

		}
		// Save as will write the new file but leaves the old file in place
		else if( dialogType === "save as" ) {
			status = process.writeFile( name, filetype, data, icon, true );
		}

		response = Util.getLog();
		Util.setLogMode( "console" );
		if( status ) {
			WindowFactory.CloseWindow( $dialog );
			if( qbs.util.isFunction( okCallback ) ) {
				okCallback( process.getFile( name ) );
			}
		} else {
			$dialog.find( ".message" ).html( response );
		}
	} );

	return $dialog;
}

function CreateSetBackgroundImageDialog( pos, src ) {
	var $dialog, contents, settings, backgroundStyles, backgroundStylesContent, style, backColor,
		image, opacity, i, color, highColor, uploadsContent, uploads, folderColor, headerColor;

	settings = FileSystem.GetSettings();
	style = settings.background.style;
	image = settings.background.image;
	folderColor = settings.background.folderColor;
	headerColor = settings.background.headerColor;
	backColor = settings.background.color;
	opacity = settings.background.opacity;
	color = settings.icons.color;
	highColor = settings.icons.highColor;

	if( src ) {
		if( style === "Solid Color" ) {
			style = "Image Cover";
		}
		image = src;
	}

	backgroundStyles = [
		"Solid Color",
		"Image Centered",
		"Image Cover",
		"Image Contain",
		"Image Tiled"
	];

	backgroundStylesContent = "";
	for( i = 0; i < backgroundStyles.length; i++ ) {
		if( backgroundStyles[ i ] === style ) {
			backgroundStylesContent += "<option selected>" + backgroundStyles[ i ] + "</option>";
		} else {
			backgroundStylesContent += "<option>" + backgroundStyles[ i ] + "</option>";
		}
	}

	uploads = FileSystem.GetDataFiles( "Uploads" );
	uploadsContent = "";
	for( i = 0; i < uploads.length; i++ ) {
		uploadsContent += "" +
			"<div class='upload-container'>" +
				"<div class='upload-img-container'><img src='" + uploads[ i ] + "' /></div>" +
				"<input type='button' value='Delete' data-src='" + uploads[ i ] + "' />" +
			"</div>";
	}

	//$( "#main" ).css( "background", "url(" + file.data + ")" );
	contents = "" +
		"<div class='settings-page'>" +
			"<div class='settings-menu'>" +
				"<div data-tab='background-set' class='selected'>Background</div>" +
				"<div data-tab='control-set'>Controls</div>" +
				"<div data-tab='uploads-set'>Uploads</div>" +
			"</div>" +
			"<div class='settings-content'>" +
				"<div class='uploads-set' style='display:none'>" +
					"<h2>Uploads</h2>" +
					"<div class='uploads-set-content'>" +
						uploadsContent +
					"</div>" +
				"</div>" +
				"<div class='control-set' style='display:none'>" +
					"<h2>Page Reset</h2>" +
					"<p>Click the button below to reset all files and settings back to their" +
					" default values. Caution, this action is not reversible.<p>" +
					"<input class='reset-page' type='button' value='Reset Page' />" +
					"<h2>Download Workspace</h2>" +
					"<p>" +
						"All your data is automatically saved to your local storage in your " +
						"browser but it will not persist the data in different browsers or on " +
						"different computers. Click the below button to download a copy of your " +
						"workspace so that you can migrate your workspace to other computers or " +
						"browsers." +
					"</p>" +
					"<input class='workspace-download' type='button' value='Download' />" +
					"<h2>Upload Workspace</h2>" +
					"<p>" +
						"You can upload your workspace by clicking the below button and " +
						"selecting your workspace file previously downloaded." +
					"</p>" +
					"<input class='workspace-upload' type='file' value='Upload' />" +
				"</div>" +
				"<div class='background-set'>" +
					"<div class='background-form'>" +
						"<div class='background-style'>" +
							"<label>Style:</label>" +
							"<select>" +
								backgroundStylesContent +
							"</select>" +
						"</div>" +
						"<div class='background-select'>" +
							"<label>Image:</label>" +
							"<input type='button' value='Select' />" +
						"</div>" +
						"<div class='background-color'>" +
							"<label>Back Color:</label>" +
							"<input type='color' value='" + backColor + "' />" +
						"</div>" +
						"<div class='icon-color'>" +
							"<label>Text Color:</label>" +
							"<input type='color' value='" + color + "' />" +
						"</div>" +
						"<div class='high-color'>" +
							"<label>Highlight:</label>" +
							"<input type='color' value='" + highColor + "' />" +
						"</div>" +
						"<div class='background-opacity'>" +
							"<label>Opacity:</label>" +
							"<input type='number' value='" + opacity + "' min='0' max='1' step='0.1' />" +
						"</div>" +
						"<div class='folder-color'>" +
							"<label>Folder:</label>" +
							"<input type='color' value='" + folderColor + "' />" +
						"</div>" +
						"<div class='header-color'>" +
							"<label>Header:</label>" +
							"<input type='color' value='" + headerColor + "' />" +
						"</div>" +
					"</div>" +
					"<div class='background-image-preview'>" +
						"<div class='background-image-preview-background'>&nbsp;</div>" +
						"<div class='preview-text'>Text Color</div>" +
						"<div class='preview-text-high'>Highlight Color</div>" +
					"</div>" +
					"<div class='background-buttons'>" +
						"<input class='background-ok' type='button' value='Ok' />" +
						"<input class='background-cancel' type='button' value='Cancel' />" +
					"</div>" +
				"</div>" +
			"</div>" +
		"</div>";

	// Create the dialog window
	$dialog = WindowFactory.CreateWindow( {
		"headerContent": "Settings",
		"bodyContent": contents,
		"footerContent": "",
		"headerHeight": 31,
		"footerHeight": 0,
		"left": pos.left - 200,
		"top": pos.top,
		"width": 500,
		"height": 550,
		"minWidth": 350,
		"minBodyHeight": 300,
		"isFolder": false,
		"icon": "url(data/img/icons/dialog.png)",
		"name": "Background"
	} );

	$dialog.find( ".workspace-download" ).on( "click", function () {
		FileSystem.SaveWorkspace();
	} );

	$dialog.find( ".workspace-upload" ).on( "change", function ( e ) {
		if( this.files.length > 0 ) {
			FileSystem.LoadWorkspace( this.files[ 0 ] );
		}
	} );

	$dialog.find( ".uploads-set-content" ).on( "click", "input[type='button']", function () {
		FileSystem.DeleteBigDataFile( this.dataset.src );
		$( this ).parent().remove();
		UpdateBackground();
	} );

	$dialog.find( ".settings-menu div" ).on( "click", function () {
		var tab;

		tab = this.dataset.tab;
		$dialog.find( ".settings-content > div" ).hide();
		$dialog.find( "." + tab ).show();
		$dialog.find( ".settings-menu .selected" ).removeClass( "selected" );
		$( this ).addClass( "selected" );
		if( tab === "background-set" ) {
			resizeForm();
		}

	} );

	$dialog.find( ".reset-page" ).on( "click", function () {
		if( window.confirm( "Are you sure you want to reset all your data?" ) ) {
			FileSystem.ResetFileSystem();
		}
	} );

	$dialog.find( ".background-style select" ).on( "change", updateForm );
	$dialog.find( ".background-form div input" ).on( "change", updateForm );

	$dialog.find( ".background-select input" ).on( "click", function () {
		CreateImageSelectorDialog( "/", pos, "", "Backgrounds", function ( selectedImage ) {
			image = selectedImage;
			updateForm();
		} );
	} );

	$dialog.find( ".background-ok" ).on( "click", function () {
		settings.background.style = style;
		settings.background.color = backColor;
		settings.background.image = image;
		settings.background.opacity = opacity;
		settings.background.folderColor = folderColor;
		settings.background.headerColor = headerColor;
		settings.icons.color = color;
		settings.icons.highColor = highColor;

		FileSystem.UpdateSettings( settings );
		UpdateBackground();
		WindowFactory.CloseWindow( $dialog );
	} );

	$dialog.find( ".background-cancel" ).on( "click", function () {
		WindowFactory.CloseWindow( $dialog );
	} );

	WindowFactory.SetOnWindowResizeEvent( $dialog, resizeForm );

	updateForm();
	resizeForm();

	function resizeForm() {
		var $preview, top, height;

		$preview = $dialog.find( ".background-image-preview" );
		top = $preview.position().top - 60;
		height = $preview.parent().height() - top - 20;
		$preview.height( height );
		$dialog.find( ".preview-text" ).css( "top", top + 70 );
		$dialog.find( ".preview-text-high" ).css( "top", top + 90 );
	}

	function updateForm() {
		var tempColor;

		style = $dialog.find( ".background-style select" ).val();
		if( style === "Solid Color" ) {
			backColor = $dialog.find( ".background-color input[type='color']" ).val();
			$dialog.find( ".background-opacity" ).css( "opacity", 0.5 );
			$dialog.find( ".background-select" ).css( "opacity", 0.5 );
			$dialog.find( ".background-opacity input" ).prop( "disabled", true );
			$dialog.find( ".background-select input" ).prop( "disabled", true );
		} else {
			$dialog.find( ".background-opacity" ).css( "opacity", 1 );
			$dialog.find( ".background-select" ).css( "opacity", 1 );
			$dialog.find( ".background-opacity input" ).prop( "disabled", false );
			$dialog.find( ".background-select input" ).prop( "disabled", false );
		}
		opacity = $dialog.find( ".background-opacity input" ).val();
		backColor = $dialog.find( ".background-color input" ).val();
		color = $dialog.find( ".icon-color input" ).val();
		highColor = $dialog.find( ".high-color input" ).val();
		headerColor = $dialog.find( ".header-color input" ).val();
		folderColor = $dialog.find( ".folder-color input" ).val();

		tempColor = qbs.util.convertToColor( highColor );
		tempColor.a = 255 * 0.35;
		tempColor = qbs.util.convertToColor( tempColor );

		$dialog.find( ".preview-text" ).css( "color", color );
		$dialog.find( ".preview-text-high" )
			.css( "background-color", tempColor.s )
			.css( "color", color );

		UpdateBackground(
			$dialog.find( ".background-image-preview-background" ),
			style, backColor, image, opacity, color, highColor, headerColor, folderColor
		);
	}
}

function UpdateBackground(
	$background, style, backColor, image, opacity, color, highColor, headerColor, folderColor
) {
	var settings;

	settings = FileSystem.GetSettings();
	if( ! $background ) {
		$background = $( "#mainBackground" );
	}
	if( ! style ) {
		style = settings.background.style;
		backColor = settings.background.color;
		image = settings.background.image;
		headerColor = settings.background.headerColor;
		folderColor = settings.background.folderColor;
		opacity = settings.background.opacity;
		color = settings.icons.color;

		// Set the highlight color
		highColor = qbs.util.convertToColor( settings.icons.highColor );
		highColor.a = 255 * 0.35;
		highColor = qbs.util.convertToColor( highColor ).s;
	}

	// Update the icon text color
	if( $background[ 0 ].id === "mainBackground" ) {
		$( "#custom-styles" ).html(
			//"#main .icon span { color: " + color + "; } " +
			"#main { color: " + color + "; } " +
			"#main .icon-selected { background-color: " + highColor + "; }" +
			"#main .icon-placeholder { background-color: " + highColor + "; }" +
			"#main .windowHeader { background-color: " + headerColor + "; }" +
			"#main .windowBody, #main .contextmenu { background-color: " + folderColor + "; }" +
			"#main .contextmenu div:hover { background-color: " + highColor + "; }"
		);
	}

	$background.parent().css( "background-color", backColor );

	if( style === "Solid Color" ) {
		$background.hide();
	} else {
		$background
			.css( "background-image", "url(" + image + ")" )
			.css( "background-color", "" )
			.css( "background-position", "" )
			.css( "background-size", "auto" )
			.css( "background-repeat", "no-repeat" )
			.css( "opacity", opacity )
			.show();

		switch( style ) {

			case "Image Centered":
				$background.css( "background-position", "center" );
				break;

			case "Image Contain":
				$background.css( "background-size", "contain" );
				$background.css( "background-position", "center" );
				break;

			case "Image Cover":
				$background.css( "background-size", "cover" );
				break;

			case "Image Tiled":
				$background.css( "background-repeat", "repeat" );
				break;
		}
	}
}

function CreateImageSelectorDialog( path, pos, iconStr, loc, okCallback ) {
	var $dialog, contents, selectOptions, locations, i;

	if( iconStr ) {
		loc = FileSystem.FindDataFile( iconStr );
	}
	locations = FileSystem.GetDataFileLocations();
	selectOptions = "";
	for( i = 0; i < locations.length; i++ ) {
		if( locations[ i ] === loc ) {
			selectOptions += "<option selected value='" + locations[ i ] + "'>" + locations[ i ] +
				"</option>";
		} else {
			selectOptions += "<option value='" + locations[ i ] + "'>" + locations[ i ] +
				"</option>";
		}
	}

	contents = "" +
		"<div class='file-dialog'>" +
			"<div class='image-folder'>" +
				"<label>Location:</label>" +
				"<select>" + selectOptions + "</select>" +
			"</div>" +
			"<div class='file-images'>&nbsp;</div>" +
			"<div class='file-buttons'>" +
				"<div class='message error-message'>&nbsp;</div>" +
				"<input class='file-save' type='button' value='Ok' />" +
				"<input class='file-cancel' type='button' value='Cancel' />" +
			"</div>" +
		"</div>";

	// Create the dialog window
	$dialog = WindowFactory.CreateWindow( {
		"headerContent": "Select Image",
		"bodyContent": contents, 
		"footerContent": "",
		"headerHeight": 31,
		"footerHeight": 0,
		"left": pos.left,
		"top": pos.top,
		"width": 470,
		"height": 400,
		"isFolder": false,
		"path": path,
		"icon": "url(data/img/icons/dialog.png)",
		"name": "Select Image",
		"hideMin": true
	} );

	$dialog.find( ".image-folder select" ).on( "change", selectImageFolder );

	$dialog.find( ".file-images" ).on( "click", "div", function () {
		$( ".file-img-selected" ).removeClass( "file-img-selected" );
		$( this ).addClass( "file-img-selected" );
	} );

	$dialog.find( ".file-save" ).on( "click", function () {
		var imgSrc, $selectedImg;

		$selectedImg = $( ".file-img-selected img" );
		if( $selectedImg.length > 0 ) {
			imgSrc = $selectedImg[ 0 ].dataset.imgsrc;
		} else {
			imgSrc = "";
		}

		okCallback( imgSrc );
		WindowFactory.CloseWindow( $dialog );

	} );

	$dialog.find( ".file-cancel" ).on( "click", function () {
		okCallback( "" );
		WindowFactory.CloseWindow( $dialog );
	} );

	selectImageFolder();

	return $dialog;

	function selectImageFolder() {
		var loc, images, $imgContainer, i, $selectedImg, divClass;

		$imgContainer = $dialog.find( ".file-images" );
		$imgContainer.html( "" );
		loc = $dialog.find( ".image-folder select" ).val();
		if( loc === "Icons" ) {
			divClass = "small";
		} else {
			divClass = "large";
		}
		images = FileSystem.GetDataFiles( loc );
		for( i = 0; i < images.length; i++ ) {
			if( images[ i ] === iconStr ) {
				$imgContainer.append(
					"<div class='file-img-selected " + divClass + "'><img src='" + images[ i ] +
						"' data-imgsrc='" + images[ i ] + "' /></div>"
				);
			} else {
				$imgContainer.append(
					"<div class='" + divClass + "'><img src='" + images[ i ] +
						"' data-imgsrc='" + images[ i ] + "' /></div>"
				);
			}
		}
		$selectedImg = $imgContainer.find( ".file-img-selected" );
		if( $selectedImg.length > 0 ) {
			$selectedImg[ 0 ].scrollIntoView( {
				"behavior": "auto",
				"block": "center",
				"inline": "nearest"
			} );
		}
	}

}

function CreateProgramSelectorDialog( path, dialogPos, data, okCallback ) {
	var $dialog, contents, programsList, i, programsContent, iconStr, selectedProgram, programName,
		classStr;

	if( data.indexOf( "start:" ) > -1 ) {
		programName = data.substring( 6 );
	}
	selectedProgram = null;
	programsContent = "";
	programsList = Command.GetPrograms();
	for( i = 0; i < programsList.length; i++ ) {
		classStr = "program-item";
		if( programsList[ i ].command === programName ) {
			classStr += " selected-program";
		}
		iconStr = programsList[ i ].icon;
		iconStr = iconStr.replace( "url(", "" );
		iconStr = iconStr.substring( 0, iconStr.length - 1 );

		programsContent += "" +
			"<div class='" + classStr + "' data-program='" + i + "'>" +
				"<div class='program-name'>" +
					"<img src='" + iconStr + "' />" +
					"<span>" + programsList[ i ].title + "</span>" +
				"</div>" +
				"<div class='program-description'>" + programsList[ i ].description + "</div>" +
			"</div>";
	}
	contents = "" +
		"<div class='file-dialog'>" +
			"<div class='file-programs'>" + programsContent + "</div>" +
			"<div class='file-buttons'>" +
				"<div class='message error-message'>&nbsp;</div>" +
				"<input class='file-save' type='button' value='Ok' />" +
				"<input class='file-cancel' type='button' value='Cancel' />" +
			"</div>" +
		"</div>";

	// Create the dialog window
	$dialog = WindowFactory.CreateWindow( {
		"headerContent": "Select Program",
		"bodyContent": contents, 
		"footerContent": "",
		"headerHeight": 31,
		"footerHeight": 0,
		"left": dialogPos.left,
		"top": dialogPos.top,
		"width": 430,
		"height": 300,
		"isFolder": false,
		"path": path,
		"icon": "url(data/img/icons/dialog.png)",
		"name": "Select Image",
		"hideMin": true
	} );

	$dialog.find( ".file-programs" ).on( "click", ".program-item", function () {
		selectedProgram = programsList[ this.dataset.program ];
		$( ".selected-program" ).removeClass( "selected-program" );
		$( this ).addClass( "selected-program" );
	} );

	$dialog.find( ".file-save" ).on( "click", function () {
		if( selectedProgram ) {
			okCallback( selectedProgram.command, selectedProgram.icon );
		} else {
			okCallback( "", "" );
		}
		WindowFactory.CloseWindow( $dialog );
	} );


	$dialog.find( ".file-cancel" ).on( "click", function () {
		okCallback( "", "" );
		WindowFactory.CloseWindow( $dialog );
	} );

	return $dialog;

}

} )();