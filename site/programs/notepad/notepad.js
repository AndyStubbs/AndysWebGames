"use strict";

var Notepad = ( function () {

	var publicAPI;

	publicAPI = {
		"start": start
	};

	return publicAPI;

	function start( params, process ) {
		var $notepad, filename, file, name, content;

		if( params.length > 1 ) {
			filename = params[ 1 ];
			file = process.getFile( filename );
			name = file.name;
			content = file.data;
		} else {
			name = "Untitled";
			content = "";
		}

		$notepad = WindowFactory.CreateWindow( {
			headerContent: "Notepad - " + name,
			bodyContent: "<textarea class='npEditor'>" + content + "</textarea>", 
			footerContent: "<div class='npFooter'></div>",
			toolbarContent: "" +
				"<div class='npToolBar'>" +
					"<input type='button' class='npToolBarButton npToolBarButtonSave' />" +
					"<input type='button' class='npToolBarButton npToolBarButtonSaveAs' />" +
					"<label>" +
						"<input class='word-wrap' type='checkbox' checked='checked' />" +
						" Word Wrap" +
					"</label>" +
				"</div>",
			headerHeight: 31,
			footerHeight: 18,
			toolbarHeight: 45,
			width: 500,
			height: 350,
			isFolder: false,
			icon: "url(data/img/icons/notebook.png)",
			name: name
		} );

		$notepad.find( ".npToolBarButtonSave" ).on( "click", function () {
			if( file === undefined ) {
				saveAs();
			} else {
				content = $notepad.find( ".npEditor" ).val();
				// Save the file and overwrite
				process.writeFile( filename, "text", content, file.icon, true );
			}
		} );
		$notepad.find( ".npToolBarButtonSaveAs" ).on( "click", saveAs );
		$notepad.find( ".windowBody" ).css( "background-color", "white ");
		$notepad.find( ".npEditor" )
			.css( "min-height", $notepad.find( ".windowBody" ).height() - 14 );

		WindowFactory.SetOnWindowResizeEvent( $notepad, function () {
			$notepad.find( ".npEditor" )
				.css( "min-height", $notepad.find( ".windowBody" ).height() - 14 );
		} );

		$notepad.find( ".word-wrap" ).on( "change", function () {
			if( $( this ).prop( "checked") === true ) {
				$notepad.find( ".npEditor" ).css( "white-space", "normal" );
			} else {
				$notepad.find( ".npEditor" ).css( "white-space", "pre" );
			}
		} );

		function saveAs() {
			content = $notepad.find( ".npEditor" ).val();
			Program.CreateFileDialog(
				"/", name, "text", content, null, "save as", file, function ( _file ) {
					file = _file;
					filename = _file.path;
					name = _file.name;
					$notepad.find( ".npEditor" ).val( _file.data );
					$notepad.find( ".windowHeader span" ).html( "Notepad - " + name );
				}
			);
		}
	}

} )();

Command.AddProgram(
	"notepad", "Notepad", Notepad.start, "url(data/img/icons/notebook.png)",
	"Allows you to write notes."
);
