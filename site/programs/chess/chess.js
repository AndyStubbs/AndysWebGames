
"use strict";

// TODO
// * Add Game over animation
// * Add pawn promotion
// * Can't castle into check
// * Can't castle out of check
// * Add stalemate

var Chess = ( function () {

	var publicAPI;

	publicAPI = {
		"start": start
	};

	return publicAPI;

	function start() {
		var g_divBoard, g_pieces, g_data, g_getMoves, $chess, content;

		content = "" +
			"<div class='chess'>" +
				"<div class='menu'></div>" +
				"<div class='board'></div>" +
				"<div class='footer'></div>"
			"</div>";

		$chess = WindowFactory.CreateWindow( {
			headerContent: "Chess",
			bodyContent: content,
			footerContent: "",
			toolbarContent: "",
			headerHeight: 31,
			footerHeight: 0,
			toolbarHeight: 0,
			width: 500,
			height: 350,
			isFolder: false,
			icon: "url(data/img/icons/chess.png)",
			name: "Chess"
		} );

		WindowFactory.SetOnWindowResizeEvent( $chess, resizeBoard );

		g_pieces = {
			"P": "&#9823;",			// Pawn
			"N": "&#9822;",			// Knight
			"B": "&#9821;",			// Bishop
			"R": "&#9820;",			// Rook
			"Q": "&#9819;",			// Queen
			"K": "&#9812;",			// King
			"&#9812;": "king",
			"&#9819;": "queen",
			"&#9820;": "rook",
			"&#9821;": "bishop",
			"&#9822;": "knight",
			"&#9823;": "pawn"
		};

		g_getMoves = {
			"P": getPawnMoves,
			"R": getRookMoves,
			"B": getBishopMoves,
			"N": getKnightMoves,
			"Q": getQueenMoves,
			"K": getKingMoves
		};

		g_data = {
			"board": [
				[ "WR1", "WN1", "WB1", "WQ1", "WK1", "WB2", "WN2", "WR2" ],
				[ "WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7", "WP8" ],
				[ "",     "",     "",   "",   "",    "",     "",   ""   ],
				[ "",     "",     "",   "",   "",    "",     "",   ""   ],
				[ "",     "",     "",   "",   "",    "",     "",   ""   ],
				[ "",     "",     "",   "",   "",    "",     "",   ""   ],
				[ "BP1", "BP2", "BP3", "BP4", "BP5", "BP6", "BP7", "BP8" ],
				[ "BR1", "BN1", "BB1", "BQ1", "BK1", "BB2", "BN2", "BR2" ]
			],
			"moves": [],
			"enpassant": null,
			"enpassantCapture": null,
			"move": "white",
			"turn": 1,
			"isCheck": false
		};

		init();

		function init() {
			createBoard();
			updateBoard();
			resizeBoard();
		}

		function createBoard() {
			var size, width, height, menuHeight;

			menuHeight = 100;
			size = {
				"width": $chess.width(),
				"height": $chess.height()
			};
			width = size.width;
			height = size.height - menuHeight;
			if( width > height ) {
				width = height;
			} else {
				height = width;
			}
			g_divBoard = $chess.find( ".board" )[ 0 ];
			g_divBoard.style.width = width + "px";
			g_divBoard.style.height = height + "px";
			g_divBoard.style.marginLeft = Math.round( ( size.width - width ) / 2 ) + "px";
			g_divBoard.style.marginTop = Math.round( ( size.height - menuHeight ) - height ) + "px";
			createSquares( width / 10 );
		}

		function resizeBoard() {
			var size, width, height, menuHeight;

			size = {
				"width": $chess.width(),
				"height": $chess.height()
			};
			menuHeight = size.height / 10;
			if( menuHeight > 100 ) {
				menuHeight = 100;
			} else if( menuHeight < 25 ) {
				menuHeight = 25;
			}
			$chess.find( ".menu" )
				.height( menuHeight )
				.css( "font-size", menuHeight + "px" )
				.css( "line-height", menuHeight + "px" );
			menuHeight += 50;

			width = size.width;
			height = size.height - menuHeight;
			if( width > height ) {
				width = height;
			} else {
				height = width;
			}
			g_divBoard.style.width = width + "px";
			g_divBoard.style.height = height + "px";
			g_divBoard.style.marginLeft = Math.round( ( size.width - width ) / 2 ) + "px";
			g_divBoard.style.marginTop = Math.round( ( size.height - menuHeight ) - height ) + "px";

			size = width / 10;
			$chess.find( ".square" ).each( function () {
				var $square;
				$square = $( this );
				$square.width( size );
				$square.height( size );
				$square.css( "line-height", size + "px" );
				if( $square.hasClass( "white" ) || $square.hasClass( "black" ) ) {
					$square.css( "font-size", ( size * 0.9 ) + "px" );
				} else {
					$square.css( "font-size", ( size * 0.5 ) + "px" );
				}
			} );

			$chess.find( ".piece" ).each( function () {
				var square, pos;

				square = $chess.find( "." + this.dataset.location )[ 0 ];
				pos = $( square ).position();
				this.style.transitionDuration = "0s";
				this.style.left = pos.left + "px";
				this.style.top = pos.top + "px";
				this.style.width = square.style.width;
				this.style.height = square.style.height;
				this.style.fontSize = square.style.fontSize;
				this.style.lineHeight = square.style.fontSize;
			} );

			setTimeout( function () {
				$chess.find( ".piece" ).css( "transition-duration", "1s" );
			}, 100 );

			$chess.find( ".move-square" ).each( function () {
				var square, location, rect;

				location = this.dataset.location;
				square = $chess.find( "." + location )[ 0 ];
				rect = $( square ).position();
				this.style.left = rect.left + "px";
				this.style.top = rect.top + "px";
				this.style.width = square.style.width;
				this.style.height = square.style.height;
			} );
		}

		function createSquares( size ) {
			var x, y, divRow, divSquare, isWhite, row, col;

			isWhite = true;
			for( y = 0; y < 10; y += 1 ) {
				divRow = document.createElement( "div" );
				for( x = 0; x < 10; x += 1 ) {
					divSquare = document.createElement( "div" );
					divSquare.className = "square";
					divSquare.style.width = size + "px";
					divSquare.style.height = size + "px";
					divSquare.style.lineHeight = size + "px";
					if( x > 0 && y > 0 && x < 9 && y < 9 ) {
						divSquare.style.fontSize = ( size * 0.9 ) + "px";
						if( isWhite ) {
							divSquare.className += " white";
						} else {
							divSquare.className += " black";
						}
						isWhite = ! isWhite;
						if( x === 8 ) {
							isWhite = ! isWhite;
						}
						row = 9 - y;
						col = "ABCDEFGH"[ x - 1 ];
						divSquare.className += " " + col + row;
					} else {
						divSquare.style.fontSize = ( size * 0.5 ) + "px";
						if( ( x === 0 || x === 9 ) && y > 0 && y < 9 ) {
							divSquare.innerHTML = 9 - y;
						}
						if( ( y === 0 || y === 9 ) && x > 0 && x < 9 ) {
							divSquare.innerHTML = "ABCDEFGH"[ x - 1 ];
						}
					}
					divRow.appendChild( divSquare );
				}
				g_divBoard.appendChild( divRow );
			}
		}

		function updateBoard() {
			var y, x, row, col, pieceName, piece, square, rect;

			// Loop through all squares on the board
			for( y = 0; y < g_data.board.length; y += 1 ) {
				for( x = 0; x < g_data.board.length; x += 1 ) {

					// Get the piece name on the square
					pieceName = g_data.board[ y ][ x ];

					// If a piece is on the square
					if( pieceName !== "" ) {
						piece = $chess.find( "." + pieceName )[ 0 ];

						row = y + 1;
						col = "ABCDEFGH"[ x ];
						square = $chess.find( "." + col + row )[ 0 ];

						// Create the piece if it doesn't already exist
						if( piece == null ) {
							piece = createPiece( pieceName, square );
						}

						// Move HTML the piece
						rect = $( square ).position();
						piece.style.left = rect.left + "px";
						piece.style.top = rect.top + "px";

						// Set the location of the piece
						piece.dataset.location = col + row;

						// Set the turn to find the dead pieces
						piece.dataset.turn = g_data.turn;
					}
				} // End x
			} // End y

			// Set players turn
			if( g_data.move === "white" ) {
				$chess.find( ".white-piece" ).each( function () {
					this.className = this.className.replace( "inactive-piece", "" )
						.trim() + " active-piece";
				} );
				$chess.find( ".black-piece" ).each( function () {
					this.className = this.className.replace( "active-piece", "" )
						.trim() + " inactive-piece";
				} );
			} else {
				$chess.find( ".black-piece" ).each( function () {
					this.className = this.className.replace( "inactive-piece", "" )
						.trim() + " active-piece";
				} );
				$chess.find( ".white-piece" ).each( function () {
					this.className = this.className.replace( "active-piece", "" )
						.trim() + " inactive-piece";
				} );
			}

			// Remove dead pieces
			$chess.find( ".piece" ).each( function () {
				if( parseInt( this.dataset.turn) !== g_data.turn ) {
					g_divBoard.removeChild( this );
				}
			} );

			updateMessage( "" );

		} // setupBoard

		function createPiece( pieceName, square ) {
			var piece;

			piece = document.createElement( "div" );
			piece.className = "piece " + pieceName;
			piece.innerHTML = g_pieces[ pieceName[ 1 ] ];
			piece.dataset.turn = "0";
			piece.style.width = square.style.width;
			piece.style.height = square.style.height;
			piece.style.fontSize = square.style.fontSize;
			piece.style.lineHeight = square.style.fontSize;
			if( pieceName[ 0 ] === "W" ) {
				piece.style.color = "white";
				piece.className += " white-piece";
			} else {
				piece.style.color = "black";
				piece.className += " black-piece";
			}

			// Add click event for piece
			piece.addEventListener( "click", function () {
				clickPiece( pieceName );
			} );

			g_divBoard.appendChild( piece );

			return piece;
		}

		function clickPiece( pieceName ) {
			var piece, selPiece, moves, i, location, checkStatus;

			piece = $chess.find( "." + pieceName )[ 0 ];

			// Stop if the piece can't be moved
			if( piece.className.indexOf( "inactive-piece" ) !== -1 ) {
				return;
			}

			clearMoves();

			// Deselect last piece
			selPiece = $chess.find( ".selected-piece" )[ 0 ];

			// Stop if selected same piece twice
			if( selPiece === piece ) {
				return;
			}

			// Select current piece
			piece.className = piece.className.replace( "selected-piece", "" )
				.replace( "active-piece", "" ).trim() + " selected-piece";

			location = piece.dataset.location;
			moves = g_getMoves[ pieceName[ 1 ] ]( location, pieceName, g_data );

			// Set move squares
			for( i = 0; i < moves.length; i++ ) {
				checkStatus = getMoveCheckStatus( getPieceXY( location ), getPieceXY( moves[ i ] ) );

				// Cannot move into a check
				if( checkStatus[ g_data.move ] === false ) {
					addMoveSquare( piece, moves[ i ], pieceName );
				}
			}

			updateMessage( pieceName );

		}

		function updateMessage( msg ) {
			if( g_data.isCheck ) {
				if( msg === "" ) {
					msg = "CHECK";
				} else {
					msg = "CHECK - " + msg;
				}
			}
			if( g_data.isCheckmate ) {
				msg = "CHECKMATE";
			}
			if( msg === "" ) {
				$chess.find( ".menu" )[ 0 ].innerHTML = g_data.move.toUpperCase();
			} else {
				$chess.find( ".menu" )[ 0 ].innerHTML = g_data.move.toUpperCase() + " - " + msg;
			}
		}

		function clearMoves() {
			var selPiece;

			// Deselect last piece
			selPiece = $chess.find( ".selected-piece" )[ 0 ];
			if( selPiece ) {
				selPiece.className = selPiece.className.replace( "selected-piece", "" )
					.trim() + " active-piece";
			}

			// Remove previos move squares
			$chess.find( ".move-square" ).each( function () {
				g_divBoard.removeChild( this );
			} );

		}

		function addMoveSquare( piece, location, pieceName ) {
			var moveSquare, square, rect;

			moveSquare = document.createElement( "div" );
			moveSquare.className = "move-square";

			square = $chess.find( "." + location )[ 0 ];
			rect = $( square ).position();
			moveSquare.dataset.location = square.className.split( " " )[ 2 ];
			moveSquare.style.left = rect.left + "px";
			moveSquare.style.top = rect.top + "px";
			moveSquare.style.width = square.style.width;
			moveSquare.style.height = square.style.height;
			moveSquare.addEventListener( "click", function () {
				movePiece( piece.dataset.location, location, pieceName, g_data );
				clearMoves();
				updateBoard();
			} );
			g_divBoard.appendChild( moveSquare );
		}

		function movePiece( fromLocation, toLocation, pieceName, data ) {
			var fromPos, toPos;

			fromPos = getPieceXY( fromLocation );
			toPos = getPieceXY( toLocation );

			// Check for castling
			if( pieceName[ 1 ] === "K" && Math.abs( fromPos.x - toPos.x ) > 1 ) {
				if( pieceName[ 0 ] === "W" ) {
					if( fromPos.x < toPos.x ) {
						data.board[ 0 ][ 7 ] = "";
						data.board[ 0 ][ 5 ] = "WR2";
					} else {
						data.board[ 0 ][ 0 ] = "";
						data.board[ 0 ][ 3 ] = "WR1";
					}
				} else {
					if( fromPos.x < toPos.x ) {
						data.board[ 7 ][ 7 ] = "";
						data.board[ 7 ][ 5 ] = "BR2";
					} else {
						data.board[ 7 ][ 0 ] = "";
						data.board[ 7 ][ 3 ] = "BR1";
					}
				}
			}

			// Move piece
			data.board[ fromPos.y ][ fromPos.x ] = "";
			data.board[ toPos.y ][ toPos.x ] = pieceName;

			data.turn += 1;
			data.moves.push( {
				"name": pieceName,
				"from": fromLocation,
				"to": toLocation
			} );

			// Check for enpassant on next turn
			if( pieceName[ 1 ] === "P" && fromPos.y === 1 || fromPos.y === 6 ) {
				data.enpassant = pieceName;
			} else {
				data.enpassant = null;
			}

			// Check for enpassant capture
			if( data.enpassantCapture && pieceName[ 1 ] === "P" ) {
				if(
					pieceName[ 0 ] === "W" && toPos.y === 5 &&
					data.board[ toPos.y - 1 ][ toPos.x ][ 1 ] === "P"
				) {
					data.board[ toPos.y - 1 ][ toPos.x ] = "";
				}

				if(
					pieceName[ 0 ] === "B" && toPos.y === 2 &&
					data.board[ toPos.y + 1 ][ toPos.x ][ 1 ] === "P"
				) {
					data.board[ toPos.y + 1 ][ toPos.x ] = "";
				}
			}

			// Swap turns
			if( data.move === "white" ) {
				data.move = "black";
			} else {
				data.move = "white";
			}

			// Update the check status
			data.isCheck = getCheckStatus( data )[ data.move ];

			if( data.isCheck ) {
				data.isCheckmate = getCheckmateStatus( data );
			} else {
				data.isCheckmate = false;
			}
		}

		function getPawnMoves( location, pieceName, data ) {
			var moves, pos;

			data.enpassantCapture = false;
			moves = [];
			pos = getPieceXY( location );
			if( pieceName[ 0 ] === "W" ) {

				// Normal move
				if( pos.y < 8 ) {
					addNewMove( { "x": pos.x, "y": pos.y + 1 }, "W", moves, true, data );
				}

				// If pawn is on home row and space is blank
				if( pos.y === 1 && data.board[ pos.y + 1 ] && data.board[ pos.y + 1 ][ pos.x ] === "" ) {
					addNewMove( { "x": pos.x, "y": pos.y + 2 }, "W", moves, true, data );
				}

				// Check for up left strike
				if( pos.x > 0 && pos.y < 8 &&
					data.board[ pos.y + 1 ][ pos.x - 1 ] !== "" &&
					data.board[ pos.y + 1 ][ pos.x - 1 ][ 0 ] === "B"
				) {
					moves.push( getPieceLocation( pos.x - 1, pos.y + 1 ) );
				}

				// Check for up right strike
				if( pos.x < 7 && pos.y < 8 && 
					data.board[ pos.y + 1 ][ pos.x + 1 ] !== "" &&
					data.board[ pos.y + 1 ][ pos.x + 1 ][ 0 ] === "B"
				) {
					moves.push( getPieceLocation( pos.x + 1, pos.y + 1 ) );
				}

				// Check for enpassant left
				if( data.enpassant && data.board[ pos.y ][ pos.x - 1 ] === data.enpassant ) {
					moves.push( getPieceLocation( pos.x - 1, pos.y + 1 ) );
					data.enpassantCapture = true;
				}

				// Check for enpassant right
				if( data.enpassant && data.board[ pos.y ][ pos.x + 1 ] === data.enpassant ) {
					moves.push( getPieceLocation( pos.x + 1, pos.y + 1 ) );
					data.enpassantCapture = true;
				}

			} else {

				// Normal move
				if( pos.y > 0 ) {
					addNewMove( { "x": pos.x, "y": pos.y - 1 }, "B", moves, true, data );
				}

				// If pawn is on home row
				//if( pos.y === 6 ) {
				if( pos.y === 6 && data.board[ pos.y - 1 ] && data.board[ pos.y - 1 ][ pos.x ] === "" ) {
					addNewMove( { "x": pos.x, "y": pos.y - 2 }, "B", moves, true, data );
				}

				// Check for up left strike
				if( pos.x > 0 && pos.y > 0 &&
					data.board[ pos.y - 1 ][ pos.x - 1 ] !== "" &&
					data.board[ pos.y - 1 ][ pos.x - 1 ][ 0 ] === "W"
				) {
					moves.push( getPieceLocation( pos.x - 1, pos.y - 1 ) );
				}

				// Check for up right strike
				if( pos.x < 7 && pos.y > 0 && 
					data.board[ pos.y - 1 ][ pos.x + 1 ] !== "" &&
					data.board[ pos.y - 1 ][ pos.x + 1 ][ 0 ] === "W"
				) {
					moves.push( getPieceLocation( pos.x + 1, pos.y - 1 ) );
				}

				// Check for enpassant left
				if( data.enpassant && data.board[ pos.y ][ pos.x - 1 ] === data.enpassant ) {
					moves.push( getPieceLocation( pos.x - 1, pos.y - 1 ) );
					data.enpassantCapture = true;
				}

				// Check for enpassant right
				if( data.enpassant && data.board[ pos.y ][ pos.x + 1 ] === data.enpassant ) {
					moves.push( getPieceLocation( pos.x + 1, pos.y - 1 ) );
					data.enpassantCapture = true;
				}

			}

			return moves;
		}

		function getRookMoves( location, pieceName, data ) {
			var moves, pos;

			function checkDir( pos, dx, dy ) {
				var check, x, y;

				check = "";
				y = pos.y;
				x = pos.x;
				while( check === "" ) {
					y += dy;
					x += dx;

					// Make sure we are still on the board
					if( x >= 0 && x <= 7 && y >= 0 && y <= 7 ) {
						check = data.board[ y ][ x ];

						// If the piece is not the same color then add the move
						if( check === "" || check[ 0 ] !== pieceName[ 0 ] ) {
							moves.push( getPieceLocation( x, y ) );
						}
					} else {
						break;
					}
				}
			}

			moves = [];
			pos = getPieceXY( location );

			// Check up
			checkDir( pos, 0, 1 );

			// Check down
			checkDir( pos, 0, -1 );

			// Check left
			checkDir( pos, -1, 0 );

			// Check right
			checkDir( pos, 1, 0 );

			return moves;
		}

		function getKnightMoves( location, pieceName, data ) {
			var moves, pos;

			function checkMove( x, y ) {
				if( data.board[ y ] && typeof data.board[ y ][ x ] === "string" ) {
					if( data.board[ y ][ x ] === "" || data.board[ y ][ x ][ 0 ] !== pieceName[ 0 ] ) {
						moves.push( getPieceLocation( x, y ) );
					}
				}
			}

			moves = [];
			pos = getPieceXY( location );

			// Check Down moves
			checkMove( pos.x - 1, pos.y - 2 );
			checkMove( pos.x + 1, pos.y - 2 );
			checkMove( pos.x - 2, pos.y - 1 );
			checkMove( pos.x + 2, pos.y - 1 );

			// Check Up Moves
			checkMove( pos.x - 1, pos.y + 2 );
			checkMove( pos.x + 1, pos.y + 2 );
			checkMove( pos.x - 2, pos.y + 1 );
			checkMove( pos.x + 2, pos.y + 1 );

			return moves;
		}

		function getBishopMoves( location, pieceName, data ) {
			var moves, pos;

			function checkDir( pos, dx, dy ) {
				var check, x, y;

				check = "";
				y = pos.y;
				x = pos.x;
				while( check === "" ) {
					y += dy;
					x += dx;

					// Make sure we are still on the board
					if( x >= 0 && x <= 7 && y >= 0 && y <= 7 ) {
						check = data.board[ y ][ x ];

						// If the piece is not the same color then add the move
						if( check === "" || check[ 0 ] !== pieceName[ 0 ] ) {
							moves.push( getPieceLocation( x, y ) );
						}
					} else {
						break;
					}
				}
			}

			moves = [];
			pos = getPieceXY( location );

			checkDir( pos, 1, 1 );
			checkDir( pos, 1, -1 );
			checkDir( pos, -1, 1 );
			checkDir( pos, -1, -1 );

			return moves;
		}

		function getQueenMoves( location, pieceName, data ) {
			var moves;

			moves = getRookMoves( location, pieceName, data );
			moves = moves.concat( getBishopMoves( location, pieceName, data ) );

			return moves;
		}

		function getKingMoves( location, pieceName, data ) {
			var moves, pos;

			function checkMove( x, y ) {
				if( data.board[ y ] && typeof data.board[ y ][ x ] === "string" ) {
					if( data.board[ y ][ x ] === "" || data.board[ y ][ x ][ 0 ] !== pieceName[ 0 ] ) {
						moves.push( getPieceLocation( x, y ) );
					}
				}
			}

			function checkHasMoved( pieceName ) {
				var isMoved;

				isMoved = false;
				data.moves.forEach( function ( move ) {
					if( move.name === pieceName ) {
						isMoved = true;
					}
				} );
				return isMoved;
			}

			moves = [];
			pos = getPieceXY( location );

			// Check Down moves
			checkMove( pos.x - 1, pos.y );		// Left
			checkMove( pos.x + 1, pos.y );		// Right
			checkMove( pos.x - 1, pos.y - 1 );	// Down Left
			checkMove( pos.x + 1, pos.y - 1 );	// Down Right
			checkMove( pos.x - 1, pos.y + 1 );	// Up Left
			checkMove( pos.x + 1, pos.y + 1 );	// Up Right
			checkMove( pos.x, pos.y + 1 );		// Up
			checkMove( pos.x, pos.y - 1 );		// DOwn

			// Check for castling
			
			if( ! checkHasMoved( pieceName ) ) {
				if( pieceName[ 0 ] === "W" ) {
					if(
						data.board[ 0 ][ 1 ] === "" &&
						data.board[ 0 ][ 2 ] === "" &&
						data.board[ 0 ][ 3 ] === ""
					) {
						if( ! checkHasMoved( "WR1" ) ) {
							moves.push( getPieceLocation( 2, 0 ) );
						}
					}
					if( data.board[ 0 ][ 5 ] === "" && data.board[ 0 ][ 6 ] === "" ) {
						if( ! checkHasMoved( "WR2" ) ) {
							moves.push( getPieceLocation( 6, 0 ) );
						}
					}
				} else {
					if( data.board[ 7 ][ 1 ] === "" && data.board[ 7 ][ 2 ] === "" && data.board[ 7 ][ 3 ] === "" ) {
						if( ! checkHasMoved( "BR1" ) ) {
							moves.push( getPieceLocation( 2, 7 ) );
						}
					}
					if( data.board[ 7 ][ 5 ] === "" && data.board[ 7 ][ 6 ] === "" ) {
						if( ! checkHasMoved( "BR2" ) ) {
							moves.push( getPieceLocation( 6, 7 ) );
						}
					}
				}
			}

			return moves;
		}

		function addNewMove( pos, color, moves, isPawn, data ) {
			var tile;

			if( pos.y >= 0 && pos.y < 8 && pos.x >= 0 && pos.x < 8 ) {
				tile = data.board[ pos.y ][ pos.x ];
				// Pawn's can only move to empty squares unless they are diagnole
				if( isPawn && tile !== "" ) {
					return;
				}
				if( tile === "" || tile.length > 1 && tile[ 0 ] !== color ) {
					moves.push( getPieceLocation( pos.x, pos.y ) );
				}
			}
		}

		function getPieceXY( location ) {
			return {
				"x": "ABCDEFGH".indexOf( location[ 0 ] ),
				"y": parseInt( location[ 1 ] ) - 1
			};
		}

		function getPieceLocation( x, y ) {
			return "ABCDEFGH"[ x ] + ( y + 1 );
		}

		function getMoveCheckStatus( fromPos, toPos ) {
			var copy, pieceName;

			// Copy the board
			copy = copyData( g_data );

			pieceName = copy.board[ fromPos.y ][ fromPos.x ];
			movePiece(
				getPieceLocation( fromPos.x, fromPos.y ),
				getPieceLocation( toPos.x, toPos.y ), pieceName, copy
			);

			// // Move the piece
			// temp = copy.board[ toPos.y ][ toPos.x ];
			// copy.board[ toPos.y ][ toPos.x ] = copy.board[ fromPos.y ][ fromPos.x ];
			// copy.board[ fromPos.y ][ fromPos.x ] = temp;

			// copy.moves.push( {
			// 	"name": copy.board[ toPos.y ][ toPos.x ],
			// 	"from": getPieceLocation( fromPos ),
			// 	"to": getPieceLocation( toPos )
			// } );

			return getCheckStatus( copy );
		}

		function getCheckStatus( data ) {
			var col, row, moves, pieceName, location, pos, i, capturePiece, checkWhite, checkBlack;

			checkWhite = false;
			checkBlack = false;

			// Loop through every square on the board
			for( row = 0; row < data.board.length; row += 1 ) {
				for( col = 0; col < data.board[ row ].length; col += 1 ) {

					// If their is a piece on the square
					if( data.board[ row ][ col ] === "" ) {
						continue;
					}

					pieceName = data.board[ row ][ col ];
					location = getPieceLocation( col, row );

					// Get all moves for that piece
					moves = g_getMoves[ pieceName[ 1 ] ]( location, pieceName, data );

					// Loop through all possible moves
					for( i = 0; i < moves.length; i++ ) {
						pos = getPieceXY( moves[ i ] );
						capturePiece = data.board[ pos.y ][ pos.x ];

						// IF the piece can capture the king then we have a check
						if( capturePiece !== "" && capturePiece[ 1 ] === "K" ) {
							if( capturePiece[ 0 ] === "W" ) {
								checkWhite = true;
							} else {
								checkBlack = true;
							}
						}

					}// moves for
				}// col for
			}// row for

			return {
				"black": checkBlack,
				"white": checkWhite
			};
		}

		function getCheckmateStatus( data ) {
			var row, col, moves, location, pieceName, i, checkStatus;

			moves = [];

			// Loop through every square on the board
			for( row = 0; row < data.board.length; row += 1 ) {
				for( col = 0; col < data.board[ row ].length; col += 1 ) {

					// If there is a piece on the square
					if( data.board[ row ][ col ] === "" ) {
						continue;
					}

					// We are only looking for same color pieces
					if( data.board[ row ][ col ].charAt( 0 ) !== data.move.charAt( 0 ).toUpperCase() ) {
						continue;
					}

					// Get all moves for the current piece
					location = getPieceLocation( col, row );
					pieceName = data.board[ row ][ col ];
					moves = g_getMoves[ pieceName[ 1 ] ]( location, pieceName, data );

					// Find out if any move does not result in a check
					for( i = 0; i < moves.length; i++ ) {
						checkStatus = getMoveCheckStatus(
							getPieceXY( location ), getPieceXY( moves[ i ] )
						);
						if( checkStatus[ data.move ] === false ) {
							return false;
						}
					}
				}
			}

			return true;
		}

		function copyBoard( board ) {
			var copy, row, col;
			copy = [];
			for( row = 0; row < board.length; row += 1 ) {
				copy.push( [] );
				for( col = 0; col < board[ row ].length; col += 1 ) {
					copy[ row ].push( board[ row ][ col ] );
				}
			}
			return copy;
		}

		function copyData( data ) {
			var newData, i;

			newData = {};
			newData.board = copyBoard( data.board );
			newData.enpassant = data.enpassant;
			newData.enpassantCapture = data.enpassantCapture;
			newData.move = data.move;
			newData.turn = data.turn;
			newData.moves = [];
			newData.isCheck = data.isCheck;
			for( i = 0; i < data.moves.length; i++ ) {
				newData.moves.push( data.moves[ i ] );
			}

			return newData;
		}
	}
} )();

Command.AddProgram(
	"chess", "Chess", Chess.start, "url(data/img/icons/chess.png)",
	"A two player chess game."
);
