"use strict";

var FileImport = ( function () {

	var publicAPI, m_imageTypes, m_$dialog, m_imgSrc;

	m_imageTypes = [
		"image/bmp", "image/gif", "image/vnd.microsoft.icon", "image/jpeg",
		"image/png", "image/svg+xml", "image/tiff", "image/webp"
	];

	publicAPI = {
		"Start": Start
	};

	$( document ).ready( initialize );

	return publicAPI;

	// Initialize buttons
	function initialize() {
		var dragEvents, i;

		// Prevent default behavior on drag events
		function noDrop( e ) {
			e.preventDefault();
			e.stopPropagation();
		}
		dragEvents = [
			"drag", "dragstart", "dragend", "dragover",
			"dragenter", "dragleave", "drop"
		];
		for( i = 0; i < dragEvents.length; i++ ) {
			document.body.addEventListener( dragEvents[ i ], noDrop );
		}

		// Change background on drag over
		function dragOver( e ) {
			document.getElementById( "dragOverPopup" ).style.display = "block";
			$( "#dragOverPopup" ).css( "z-index", WindowFactory.GetZIndex() );
		}
		dragEvents = [ "dragover", "dragenter" ];
		for( i = 0; i < dragEvents.length; i++ ) {
			document.body.addEventListener( dragEvents[ i ], dragOver );
		}

		// Change background on drag out
		function dragOut( e ) {
			document.getElementById( "dragOverPopup" ).style.display = "none";
		}
		dragEvents = [ "dragleave", "dragend", "drop" ];
		for( i = 0; i < dragEvents.length; i++ ) {
			document.getElementById( "dragOverPopup" )
				.addEventListener( dragEvents[ i ], dragOut );
		}

		// Dropped File
		function droppedFile( e ) {
			var droppedFiles, fileInput, contents, $dialog, reader;

			if( e.dataTransfer.files.length > 0 ) {
				droppedFiles = e.dataTransfer.files[ 0 ];

				if( droppedFiles.type === "text/plain" ) {
					reader = new FileReader();
					reader.readAsText( droppedFiles );
					reader.onload = function () {
						//console.log( reader.result );
						Program.CreateFileDialog(
							"/", "Untitled", "text", reader.result, null, "new"
						);
					};
					return;
				}

				showImportPopup();
				fileInput = m_$dialog.find( "#loadImageFile" )[ 0 ];
				fileInput.files = e.dataTransfer.files;

				// Load the image viewer based on data type
				if( m_imageTypes.indexOf( fileInput.files[ 0 ].type ) > - 1) {
					m_$dialog.find( ".file-msg" ).hide();
					loadImage( fileInput.files[ 0 ] );
				} else {
					m_$dialog.find( ".file-msg" ).show();
				}
			} else if( e.dataTransfer.items.length > 0 ) {
				contents = e.dataTransfer.getData( "text" );
				$dialog = Program.CreateFileDialog( "/", "Link", "link", contents, null, "new" );
			}
		}

		document.getElementById( "dragOverPopup" ).addEventListener( "drop", droppedFile );
	}

	function showImportPopup() {
		Start( "/" );
	}

	function Start( path ) {
		var size, content;

		if( m_$dialog ) {
			WindowFactory.SetOnFocusEvent( m_$dialog );
			return;
		}

		size = Util.getWindowSize();
		content = "" +
			"<div class='file-import'>" +
				"<h2>Import Image</h2>" +
				"<p>" +
					"Imported images will be stored in your browser's local storage which has" +
					" limited space, around 10 MB. So you should not import large files." +
					" If you want to use large images you can upload them to another site" +
					" and enter the link here as a picture file. Imported images are good for " +
					"small files such as icons." +
				"</p>" +
				"<div>" +
					"<input id='loadImageFile' type='file' value='Import File' />" +
				"</div>" +
				"<div class='file-viewer'>" +
					"<span class='file-msg' style='display: none;'>Invalid image format</span>" +
					"<img class='file-image' />" +
				"</div>" +
				"<div class='file-buttons'>" +
					"<input class='file-button-create' type='button' value='Create File' disabled='disabled' />" +
					"<input class='file-button-ok' type='button' value='Ok' disabled='disabled' />" +
					"<input class='file-button-cancel' type='button' value='Cancel' />" +
				"</div>" +
			"</div>";

		m_$dialog = WindowFactory.CreateWindow( {
			headerContent: "File Import",
			bodyContent: content,
			footerContent: "",
			toolbarContent: "",
			headerHeight: 31,
			footerHeight: 0,
			toolbarHeight: 0,
			left: size.width / 2 - 300,
			top: size.height / 2 - 250,
			width: 600,
			height: 500,
			minWidth: 300,
			minBodyHeight: 250,
			isFolder: false,
			icon: "url(data/img/icons/dialog.png)",
			name: "File Import"
		} );

		m_$dialog.find( "#loadImageFile" ).on( "change", function () {
			var fileInput, reader;

			fileInput = m_$dialog.find( "#loadImageFile" )[ 0 ];

			// Load the image viewer based on data type
			if( m_imageTypes.indexOf( fileInput.files[ 0 ].type ) > - 1 ) {
				m_$dialog.find( ".file-msg" ).hide();
				loadImage( fileInput.files[ 0 ] );
			} else {
				reader = new FileReader();
				reader.readAsText( fileInput.files[ 0 ] );
				reader.onload = function () {
					//console.log( reader.result );
					Program.CreateFileDialog(
						"/", "Untitled", "text", reader.result, null, "new"
					);
				};
				//m_$dialog.find( ".file-msg" ).show();
				//m_$dialog.find( ".file-image" )[ 0 ].src = "";
			}
		} );

		m_$dialog.find( ".file-button-cancel" ).on( "click", function () {
			WindowFactory.CloseWindow( m_$dialog );
		} );

		m_$dialog.find( ".file-button-ok" ).on( "click", function () {
			saveFile();
			WindowFactory.CloseWindow( m_$dialog );
		} );

		m_$dialog.find( ".file-button-create" ).on( "click", function () {
			var $dialog;

			saveFile( function () {
				$dialog = Program.CreateFileDialog( path, "Picture", "picture", path, null, "new" );
				setTimeout( function () {
					$dialog.find( ".data .select-image" ).trigger( "click" );
					setTimeout( function () {
						var $active = WindowFactory.GetActiveWindow();
						$active.find( ".image-folder select" ).val( "Uploads" ).trigger( "change" );
						$active.find( ".file-images div" ).last().addClass( "file-img-selected" );
					}, 1 );
				}, 1 );
			} );
			WindowFactory.CloseWindow( m_$dialog );
		} );

		WindowFactory.SetOnCloseWindow( m_$dialog, function () {
			URL.revokeObjectURL( m_imgSrc );
			m_$dialog = null;
			m_imgSrc = null;
		} );

		WindowFactory.SetOnWindowResizeEvent( m_$dialog, resizeImage );

		function saveFile( callback ) {
			var canvas, context, img, pct, maxSize;

			canvas = document.createElement( "canvas" );
			context = canvas.getContext( "2d" );
			img = m_$dialog.find( ".file-image" )[ 0 ];
			maxSize = 500000;

			if( img.naturalWidth * img.naturalHeight > maxSize ) {
				pct = Math.sqrt( maxSize ) / Math.sqrt( img.naturalWidth * img.naturalHeight );
				canvas.width = Math.round( img.naturalWidth * pct );
				canvas.height = Math.round( img.naturalHeight * pct );
			} else {
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
			}
			context.drawImage(
				img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height
			);
			FileSystem.CreateDataFile( canvas, callback );
		}
	}

	function loadImage( file ) {
		var img;

		m_$dialog.find( ".file-button-ok" ).prop( "disabled", true );
		img = m_$dialog.find( ".file-image ")[ 0 ];
		m_imgSrc = URL.createObjectURL( file );
		img.src = m_imgSrc;
		img .onload = function () {
			m_$dialog.find( ".file-button-ok" ).prop( "disabled", false );
			m_$dialog.find( ".file-button-create" ).prop( "disabled", false );
			resizeImage();
		};
	}

	function resizeImage() {
		var height, containerHeight;

		containerHeight = m_$dialog.find( ".file-viewer" ).height();
		height = m_$dialog.find( ".file-image" ).height();
		m_$dialog.find( ".file-image" ).css( "margin-top",
			( containerHeight - height ) / 2
		);
	}

} )();
