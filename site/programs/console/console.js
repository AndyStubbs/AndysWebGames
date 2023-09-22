"use strict";

var Console = ( function () {

	var publicAPI;

	publicAPI = {
		"start": start
	};

	return publicAPI;

	function start( params, process ) {
		var $console, $commandLine, $commandText, $promptDir, $promptSym, $consoleBody, $block,
			cursorPosition, isInsert, commands, commandIndex;

		commands = [];
		commandIndex = 0;
		cursorPosition = 0;
		isInsert = false;

		$console = WindowFactory.CreateWindow( {
			headerContent: "Console", 
			bodyContent: "" +
				"<div class='console'>Type help for a list of commands.\n\n" +
					"<div class='command-line'>" +
						"<div class='prompt-dir'>/Documents/Photos</div>" +
						"<span class='prompt-sym'>&gt;</span><span class='command-text'></span>" +
						"<span class='block blinking' style='top: 2.5px'>&lhblk;</span>" +
					"</div>" +
				"</div>",
			footerContent: "",
			toolbarContent: "",
			headerHeight: 31,
			footerHeight: 0,
			toolbarHeight: 0,
			width: 620,
			height: 350,
			isFolder: false,
			icon: "url(data/img/icons/console.png)",
			name: "Console"
		} );

		$commandLine = $console.find( ".command-line" );
		$commandText = $console.find( ".command-text" );
		$promptDir = $console.find( ".prompt-dir" );
		$promptSym = $console.find( ".prompt-sym" );
		$consoleBody = $console.find( ".console" );
		$block = $console.find( ".block" );

		WindowFactory.SetOnFocusEvent( $console, OnFocus );
		WindowFactory.SetOnBlurEvent( $console, OnBlur );
		WindowFactory.SetOnKeydownEvent( $console, KeyDown );

		$promptDir.html( process.getPath() );

		if( params.length > 1 ) {
			execute( params[ 1 ] );
		}

		function OnFocus() {
			$block.show();
			$block.addClass( "blinking" );
		}

		function OnBlur() {
			$block.removeClass( "blinking" );
			$block.hide();
		}

		function KeyDown( e ) {
			var text, charWidth, offset;
	
			text = $commandText.html();
	
			//Util.log( e.keyCode );
			if(
				( e.keyCode === 32 ) ||
				( e.keyCode >= 48 && e.keyCode <= 90 ) ||
				( e.keyCode >= 96 && e.keyCode <= 111 ) ||
				( e.keyCode >= 186 && e.keyCode <= 222 )
			) {
				if( cursorPosition === text.length ) {
					text += e.key;
				} else {
					if( isInsert ) {
						offset = 1;
					} else {
						offset = 0;
					}
					text = text.substring( 0, cursorPosition ) + e.key +
						text.substring( cursorPosition + offset );
				}
				$commandText.html( text );
				cursorPosition += 1;
			} else {
	
				// Enter Key
				if( e.keyCode === 13 ) {

					if( text !== "" ) {
						commands.push( text );
					}
					commandIndex = commands.length;
					
					execute( text );

					// Prepare next line
					text = "";
					$commandText.html( text );
					cursorPosition = 0;
					$consoleBody[ 0 ].scrollTop = $consoleBody[ 0 ].scrollHeight;
					$promptDir.html( process.getPath() );
				}
				// Backspace Key
				else if( e.keyCode === 8 ) {
					if( text.length > 0 ) {
						text = text.substring( 0, cursorPosition - 1 ) + 
							text.substring( cursorPosition );
						$commandText.html( text );
						cursorPosition -= 1;
					}
				}
				// Delete Key
				else if( e.keyCode === 46 ) {
					if( text.length > 0 && cursorPosition < text.length ) {
						text = text.substring( 0, cursorPosition ) +
							text.substring( cursorPosition + 1 );
						$commandText.html( text );
					}
				}
				// Tab Key
				else if( e.keyCode === 9 ) {
					//$command[ 0 ].innerHTML += "\t";
					e.preventDefault();
				}
				// Insert Key
				else if( e.keyCode === 45 ) {
					isInsert = ! isInsert;
					if( isInsert ) {
						$block.html( "&block;" );
						$block.css( "top", 0 );
					} else {
						$block.html( "&lhblk;" );
						$block.css( "top", 2.5 );
					}
				}
				// Home Key
				else if( e.keyCode === 36 ) {
					cursorPosition = 0;
				}
				// End Key
				else if( e.keyCode === 35 ) {
					cursorPosition = text.length;
				}
				// Left Arrow
				else if( e.keyCode === 37 ) {
					cursorPosition -= 1;
					e.preventDefault();
				}
				// Right Arrow
				else if( e.keyCode === 39 ) {
					cursorPosition += 1;
					e.preventDefault();
				}
				// Up Arrow
				else if( e.keyCode === 38 ) {
					commandIndex -= 1;
					if( commandIndex < 0 ) {
						commandIndex = 0;
					}
					if( commands.length > commandIndex ) {
						text = commands[ commandIndex ];
						cursorPosition = text.length;
					}
					$commandText.html( text );
					e.preventDefault();
				}
				// Down Arrow
				else if( e.keyCode === 40 ) {
					commandIndex += 1;
					if( commandIndex > commands.length - 1 ) {
						commandIndex = commands.length;
						text = "";
						cursorPosition = 0;
					}
					if( commands.length > commandIndex ) {
						text = commands[ commandIndex ];
						cursorPosition = text.length;
					}
					$commandText.html( text );
					e.preventDefault();
				}
			}

			if( cursorPosition > text.length ) {
				cursorPosition = text.length;
			}

			// Calc the width of a character
			charWidth = $commandText.width() / text.length;

			// Position the block at the cursor position
			$block.css( "left", -( text.length - cursorPosition ) * charWidth );

		}

		function execute( text ) {
			var response, $response;

			response = "";

			// Check for clear screen command
			if(
				text.indexOf( "cls" ) === 0 &&
				( text.length === 3 || text.charAt( 3 ) === " " )
			) {
				// Clear the parent of html the append the command line back in the parent
				$commandLine.parent().html( "" ).append( $commandLine );
			} else {
				$commandLine.before(
					$promptDir[ 0 ].outerHTML + $promptSym.html() + text + "\n\n"
				);
				Util.setLogMode( "string" );
				Util.clearLog();
				process.run( text );
				response = Util.getLog();
				Util.setLogMode( "console" );
			}

			// Process response
			if( typeof response === "string" && response !== "" ) {
				$response = $( "<div>" + response + "</div><br />" );

				// Append response to console window
				$commandLine.before( $response );

				// Build links for dir command
				$response.parent().find( ".click-line" ).each( function () {
					var $a, file;
					$a = $( this );
					$a.removeClass( "click-line" );
					file = FileSystem.getFile( $a.attr( "data-path" ) );
					$a.removeAttr( "data-path" );
					$a.on( "click", function () {
						Command.Execute( file );
					} );
				} );

			}
		}
	}

	
} )();

Command.AddProgram(
	"console", "Console", Console.start, "url(data/img/icons/console.png)", "Allows you to type commands."
);
