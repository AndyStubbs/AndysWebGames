"use strict";

var RssReader = ( function () {

	var publicAPI, cache, cacheDelay;

	cache = {};
	cacheDelay = 900000;		// 900000 milliseconds = 15 minutes
	publicAPI = {
		"start": start
	};

	return publicAPI;

	function start( params, process ) {
		var $reader, name, content, settings, settingsFilename, settingsFile, $dialog, ajaxRequests,
			ajaxLoaded, videos, maxVideos, filterUpdateTimeout;

		name = "Channel Tracker";
		ajaxRequests = 0;
		ajaxLoaded = 0;
		maxVideos = 15;

		if( params.length > 1 ) {
			settingsFilename = params[ 1 ];
		} else {
			settingsFilename = "Tracker Settings";
		}
		settingsFile = process.getFile( settingsFilename );
		if( ! settingsFile ) {
			process.writeFile( settingsFilename, "data", "{}" );
			settingsFile = process.getFile( settingsFilename );
		}
		try {
			settings = JSON.parse( settingsFile.data );
		} catch( ex ) {
			settings = { "categories": [], "channels": [], "activeFilters": [] };
			process.writeFile( settingsFilename, "data", settings, null, true );
		}
		if( ! settings.categories ) {
			settings.categories = [];
		}
		if( ! settings.channels ) {
			settings.channels = [];
		}
		if( ! settings.activeFilters ) {
			settings.activeFilters = [];
		}

		content = "" +
			"<div class='rssReader'>" +
				"<div class='rss-menu'>" +
					"<div data-tab='channels' class='selected'>View Channels</div>" +
					"<div data-tab='search'>Add Channel</div>" +
					"<div data-tab='settings'>Settings</div>" +
				"</div>" +
				"<div class='rss-content'>" +
					"<div class='rss-search' style='display:none;'>" +
						"<label>Channel:</label>" +
						"<input class='rssUrl' type='text' value='' />" +
						"<input class='rss-fetch-button' type='button' value='Fetch' />" +
						"<div style='margin:5px'>Enter a Youtube or Bitchute channel link.</div>" +
						"<div class='rss-search-results'>" +
						"</div>" +
					"</div>" +
					"<div class='rss-channels'>" +
						"<div class='rss-category-filters'>" +
						"</div>" +
						"<div class='rss-channels-view'>" +
							"<p>No categories selected.</p>" +
						"</div>" +
						"<div style='text-align: center'>" +
							"<input class='rss-show-more' type='button' value='Show More' style='display: none;' />" +
						"</div>" +
					"</div>" +
					"<div class='rss-settings' style='display:none;'>" +
					"</div>" +
				"</div>" +
			"</div>";

		$reader = WindowFactory.CreateWindow( {
			headerContent: "Channel Tracker",
			bodyContent: content,
			footerContent: "",
			toolbarContent: "",
			headerHeight: 31,
			footerHeight: 0,
			toolbarHeight: 0,
			minWidth: 445,
			minBodyHeight: 300,
			width: 600,
			height: 500,
			isFolder: false,
			icon: "url(data/img/icons/dialog.png)",
			name: name
		} );

		updateFilters( $reader, settings );
		updateSettingsTab();
		setupShowMoreButton();

		$reader.find( ".rss-menu" ).on( "click", "div", function () {
			var tab;
			tab = this.dataset.tab;

			// Show the new tab
			$reader.find( ".rss-content > div" ).hide();
			$reader.find( ".rss-content > .rss-" + tab ).show();

			// Update the tab buttons
			$reader.find( ".rss-menu > div" ).removeClass( "selected" );
			$( this ).addClass( "selected" );

		} );

		$reader.find( ".rssUrl" ).on( "change", function () {
			fetchChannelData( $( this ).val().trim() );
		} );
		$reader.find( ".rss-fetch-button" ).on( "click", function () {
			fetchChannelData( $reader.find( '.rssUrl' ).val().trim() );
		} );

		WindowFactory.SetOnWindowResizeEvent( $reader, resizeVideo );

		function fetchChannelData( rssUrl ) {
			var urlLower, channelId, start, end;

			$reader.find( ".rss-search-results" ).html(
				"<div class='rss-error'>Loading...</div>"
			);

			urlLower = rssUrl.toLowerCase();

			// If it's just a channel id then default to youtube
			if( urlLower.indexOf( ".com/" ) === -1 ) {
				rssUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=" + rssUrl;
			} else {

				// If the link was provided to the channel then we will convert it
				// to the rss feed URL. Because the channel url is easier to find
				// then the rss feed URL.
				start = urlLower.indexOf( "channel/" ) + 8;
				if( start === 7 ) {
					start = urlLower.indexOf( "channel=" ) + 8;
				}
				if( start === 7 ) {
					start = urlLower.indexOf( "channel_id=" ) + 11;
				}
				if( start > 10 ) {
					end = Math.max(
						urlLower.indexOf( "/", start ),
						urlLower.indexOf( "&", start ),
						urlLower.indexOf( "?", start )
					);
					if( end === -1 ) {
						end = urlLower.length;
					}
					channelId = rssUrl.substring( start, end );

					if( urlLower.toLowerCase().indexOf( "bitchute.com" ) > -1 ) {
						// https://www.bitchute.com/feeds/rss/channel/switchedtolinux/
						rssUrl = "https://www.bitchute.com/feeds/rss/channel/" + channelId;
					} else if( urlLower.toLowerCase().indexOf( "youtube.com" ) > -1 ) {
						rssUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId;
					}
				}
			}

			getChannelData( rssUrl,
				function ( channelData ) {
					CreateChannelView(
						$reader, process, channelData, settings, settingsFilename, rssUrl
					);
					resizeVideo();
				},
				function ( channelData ) {
					console.error( channelData );
					$reader.find( ".rss-search-results" ).html(
						"<div class='rss-error'>Unable to find channel.</div>"
					);
				}
			);
		}

		function getChannelData( rssUrl, callback, errorCallback ) {
			var cacheLookup;

			ajaxRequests += 1;

			// Check cache for results
			cacheLookup = rssUrl + "_" + Math.floor( ( new Date ).getTime() / cacheDelay );
			if( cache[ cacheLookup ] ) {
				setTimeout( function () {
					ajaxLoaded += 1;
					if( cache[ cacheLookup ].status === "success" ) {
						callback( cache[ cacheLookup ].data, ajaxLoaded >= ajaxRequests );
					} else {
						errorCallback( cache[ cacheLookup ].data );
					}
				}, 1 );
				return;
			}

			// Get results from server
			$.ajax( {
				"type": "post",
				"url": "control.php",
				"data": {
					"mode": "rss",
					"url": rssUrl
				},
				"dataType": "json",
				"success": function ( channelData ) {
					var data, i;

					data = {};

					// Bitchute Channel
					if( channelData.channel ) {
						data.title = channelData.channel.title;
						data.entry = [];
						for( i = 0; i < channelData.channel.item.length; i++ ) {
							data.entry.push( {
								"link": channelData.channel.item[ i ].link,
								"title": channelData.channel.item[ i ].title,
								"published": channelData.channel.item[ i ].pubDate
							} );
						}
					}

					// Youtube Channel
					if( channelData.entry ) {
						data.title = channelData.title;
						data.entry = [];
						for( i = 0; i < channelData.entry.length; i++ ) {
							data.entry.push( {
								"link": channelData.entry[ i ].link[ "@attributes" ].href,
								"title": channelData.entry[ i ].title,
								"published": channelData.entry[ i ].published
							} );
						}
					}

					cache[ cacheLookup ] = {
						"data": data,
						"status": "success"
					};
					ajaxLoaded += 1;
					callback( data, ajaxLoaded >= ajaxRequests );
				},
				"error": function ( channelData ) {
					cache[ cacheLookup ] = {
						"data": channelData,
						"status": "error"
					};
					ajaxLoaded += 1;
					errorCallback( channelData );
				}
			} );
		}

		function resizeVideo() {
			var width, height, maxWidth, maxHeight;

			maxWidth = 500;
			maxHeight = 281;

			width = $reader.width() - 40;
			height = Math.round( width * 0.5625 );

			if( width > 600 ) {
				$reader.find( ".rss-video" ).css( "margin", "5px 15px" );
			} else {
				$reader.find( ".rss-video" ).css( "margin", "" );
			}
			if( height > $reader.height() - 50 ) {
				height = $reader.height() - 50;
				width = Math.round( height * 1.778 );
				if( width > $reader.width() - 40 ) {
					width = $reader.width() - 40;
					height = Math.round( width * 0.5 );
				}
			}

			if( width > maxWidth ) {
				width = maxWidth;
			}
			if( height > maxHeight ) {
				height = maxHeight;
			}

			$reader.find( "iframe" )
				.css( "width", width )
				.css( "height", height );
		}

		function CreateChannelView(
			$reader, process, channelData, settings, settingsFilename, rssUrl
		) {
			var content, i, entry, link, dateStr, title, data;
	
			console.log( channelData );
			if( ! channelData || ! channelData.title ) {
				$reader.find( ".rss-search-results" ).html(
					"<div class='rss-error'>Unable to find channel.</div>"
				);
				return;
			}

			content = "" +
				"<h2>Channel Details</h2>" +
				"<div class='rss-channel-title'>" +
					"<span>" + channelData.title + "</span><br />" +
					"<input class='rss-add-channel' type='button' value='Add to Channels' />" +
				"</div>" +
				"<h2>Lateset Videos</h2>" + 
				"<div class='rss-videos'>";

			for( i = 0; i < channelData.entry.length; i++ ) {
				entry = channelData.entry[ i ];
				link = entry.link;
				dateStr = Util.formatDate( new Date( entry.published ) );
				title = entry.title;
				if( title.length > 60 ) {
					title = title.substring( 0, 57 ) + "...";
				}
				content += createVideoDiv( dateStr, link, title );
			}
			content += "</div>";
			$reader.find( ".rss-search-results" ).html( content );

			CreateSaveVideoLink();

			$reader.find( ".rss-add-channel" ).on( "click", function () {
				var pos, path;
	
				pos = $reader.offset();
				path = process.getPath();
	
				if( $dialog ) {
					WindowFactory.SetActiveWindowFromElement( $dialog );
				} else {
					CreateAddChannelDialog( channelData.title, settings, pos, path,
						function ( title, category ) {
							if( ! settings.channels ) {
								settings.channels = [];
							}
							if( ! settings.categories ) {
								settings.categories = [];
							}
							if( settings.categories.indexOf( category ) === -1 ) {
								settings.categories.push( category );
							}
							settings.channels.push( {
								"title": title,
								"category": category,
								"link": rssUrl
							} );
							process.writeFile(
								settingsFilename, "data", JSON.stringify( settings ), null, true
							);
							updateFilters( $reader, settings );
							updateSettingsTab();
						}
					);
				}
			} );
		}

		function CreateSaveVideoLink() {
			$reader.find( ".rss-videos" ).on( "click", ".rss-save-btn",
				function () {
					var link, title;

					link = this.dataset.src;
					title = this.dataset.title;
					Program.CreateFileDialog( "/", title, "video", link, null, "new" );

				}
			);
			$reader.find( ".rss-videos" ).on( "click", ".rss-open-btn",
				function () {
					var link, title, tempFile;

					link = this.dataset.src;
					title = this.dataset.title;
					tempFile = {
						"type": "script",
						"data": "sys:watch \"~~link~~" + link + "~~title~~" + title + "\"",
						"parent": "/",
						"path": "/",
						"icon": "url(data/img/icons/video.png)"
					};
					Command.Execute( tempFile );
				}
			);
		}

		function CreateAddChannelDialog( title, settings, pos, path, okCallback ) {
	
			var contents, categoriesContent, i;
	
			if( ! settings.categories || settings.categories.length === 0 ) {
				settings.categories = [];
			}
			categoriesContent = "" +
				"<div>" +
					"<label>Category:</label>" +
					"<select class='add-channel-cat'>";
	
			for( i = 0; i < settings.categories.length; i++ ) {
				categoriesContent += "<option>" + settings.categories[ i ] + "</option>";
			}
			categoriesContent += "<option>New Category</option>";
			categoriesContent += "</select></div>";
	
			contents = "" +
				"<div class='rss-add-channel'>" +
					"<div>" +
						"<label>Title:</label>" +
						"<input class='add-channel-title' type='text' value='" + title + "' />" +
					"</div>" +
					categoriesContent +
					"<div class='rss-add-new-cat'>" +
						"<label>Category Name: </label>" +
						"<input class='add-channel-new-cat' type='text' disabled />" +
					"</div>" +
					"<div class='rss-add-msg'>" +
						"&nbsp;" +
					"</div>" +
					"<div class='rss-add-buttons'>" +
						"<input class='rss-add-ok' type='button' value='Ok' />" +
						"<input class='rss-add-cancel' type='button' value='Cancel' />" +
					"</div>" +
				"</div>";
	
			// Create the dialog window
			$dialog = WindowFactory.CreateWindow( {
				"headerContent": "Add Channel",
				"bodyContent": contents, 
				"footerContent": "",
				"headerHeight": 31,
				"footerHeight": 0,
				"left": pos.left + 50,
				"top": pos.top + 50,
				"width": 330,
				"height": 190,
				"isFolder": false,
				"path": path,
				"icon": "url(data/img/icons/dialog.png)",
				"name": "Add Channel",
				"hideMin": true
			} );
	
			$dialog.find( ".add-channel-cat" ).on( "change", function () {
				changeCategory( this );
			} );
			changeCategory( $dialog.find( ".add-channel-cat" )[ 0 ] );
	
			$dialog.find( ".rss-add-cancel" ).on( "click", function () {
				WindowFactory.CloseWindow( $dialog );
				$dialog = false;
			} );
	
			$dialog.find( ".rss-add-ok" ).on( "click", function () {
				var category, title;
	
				title = $dialog.find( ".add-channel-title" ).val();
				category = $dialog.find( ".add-channel-cat" ).val();
				if( category === "New Category" ) {
					category = $dialog.find( ".add-channel-new-cat" ).val();
				}
				if( title === "" ) {
					$dialog.find( ".rss-add-msg" ).html( "You must enter a title." );
					return;
				}
				if( category === "" ) {
					$dialog.find( ".rss-add-msg" ).html( "You must enter a category." );
					return;
				}
	
				okCallback( title, category );
				WindowFactory.CloseWindow( $dialog );
				$dialog = false;
	
			} );

			function changeCategory( element ) {
				var category;
	
				$dialog.find( ".rss-add-msg" ).html( "&nbsp;" );
				category = $( element ).val();
				if( category === "New Category" ) {
					$dialog.find( ".rss-add-new-cat" ).css( "opacity", 1 );
					$dialog.find( ".add-channel-new-cat" ).prop( "disabled", false );
				} else {
					$dialog.find( ".rss-add-new-cat" ).css( "opacity", 0.2 );
					$dialog.find( ".add-channel-new-cat" ).prop( "disabled", true );
				}
			}
		}

		function updateFilters( $reader, settings ) {
			var i, channelsFilterContents, category, checkedString;
	
			channelsFilterContents = "";
			for( i = 0; i < settings.categories.length; i++ ) {
				category = settings.categories[ i ];
				if( settings.activeFilters.indexOf( category ) > -1 ) {
					checkedString = " checked='checked'"
				} else {
					checkedString = "";
				}
				channelsFilterContents += "" +
					"<label class='rss-category-filter' data-filter='" + category + "'>" +
						"<input type='checkbox'" + checkedString + " />" +
						category +
					"</label>";
			}

			$reader.find( ".rss-category-filters" ).html( channelsFilterContents );

			$reader.find( ".rss-category-filter input[type='checkbox']" ).on( "change",
				function () {
					var filter, $checkbox;
		
					$checkbox = $( this );
					filter = $( this ).parent()[ 0 ].dataset.filter;
		
					if( $checkbox.prop( "checked" ) ) {
						if( settings.activeFilters.indexOf( filter ) === -1 ) {
							settings.activeFilters.push( filter );
						}
					} else {
						if( settings.activeFilters.indexOf( filter ) !== -1 ) {
							settings.activeFilters.splice(
								settings.activeFilters.indexOf( filter ), 1
							);
						}
					}
					clearTimeout( filterUpdateTimeout );
					if( settings.activeFilters.length > 0 ) {
						$reader.find( ".rss-channels-view" ).html( "<p>Loading...</p>" );
						$reader.find( ".rss-show-more" ).hide();
						filterUpdateTimeout = setTimeout( updateChannelFilters, 1000 );
					} else {
						updateChannelFilters();
					}
				}
			);

			if( settings.activeFilters.length > 0 ) {
				updateChannelFilters();
			}
		}

		function updateChannelFilters() {
			var i, channel, channels, foundChannel;

			if( settings.activeFilters.length === 0 ) {
				$reader.find( ".rss-channels-view" ).html( "<p>No categories selected.</p>" );
				$reader.find( ".rss-show-more" ).hide();
				return;
			} else {
				$reader.find( ".rss-channels-view" ).html( "<p>Loading...</p>" );
				$reader.find( ".rss-show-more" ).hide();
			}

			channels = [];
			foundChannel = false;
			for( i = 0; i < settings.channels.length; i++ ) {
				channel = settings.channels[ i ];
				if( settings.activeFilters.indexOf( channel.category ) !== -1 ) {
					foundChannel = true;
					getChannelData( channel.link,
						function ( channelData, isComplete ) {
							channels.push( channelData );
							if( isComplete ) {
								updateChannels( channels );
							}
						},
						function ( channelData ) {
							console.error( channelData );
							$reader.find( ".rss-search-results" ).html(
								"<div class='rss-error'>Unable to find channel.</div>"
							);
						}
					);
				}
			}

			if( ! foundChannel ) {
				$reader.find( ".rss-channels-view" ).html( "<p>No channels found.</p>" );
				$reader.find( ".rss-show-more" ).hide();
			}
		}

		function updateChannels( channels ) {
			var i, content, entry, dateStr, link, title;

			if( channels.length === 0 ) {
				$reader.find( ".rss-channels-view" ).html( "<p>No channels found.</p>" );
				$reader.find( ".rss-show-more" ).hide();
				return;
			}

			videos = [];
			for( i = 0; i < channels.length; i++ ) {
				videos = videos.concat( channels[ i ].entry );
			}

			if( videos.length === 0 ) {
				$reader.find( ".rss-channels-view" ).html( "<p>No videos found.</p>" );
				$reader.find( ".rss-show-more" ).hide();
				return;
			}

			videos.sort( function ( a, b ) {
				var dt1, dt2;
				dt1 = new Date( a.published );
				dt2 = new Date( b.published );
				if( dt1 > dt2 ) {
					return -1;
				} else if( dt1 < dt2 ) {
					return 1;
				} else {
					return 0;
				}
			} );

			content = "<div class='rss-videos'>"
			for( i = 0; i < maxVideos && i < videos.length; i++ ) {
				entry = videos[ i ];
				link = entry.link;
				dateStr = Util.formatDate( new Date( entry.published ) );
				title = entry.title;

				content += createVideoDiv( dateStr, link, title );
			}

			if( videos.length > i ) {
				$reader.find( ".rss-show-more" ).show();
				$reader.find( ".rss-show-more" )[ 0 ].dataset.last = maxVideos;
			} else {
				$reader.find( ".rss-show-more" ).hide();
			}
			content += "</div>";
			$reader.find( ".rss-channels-view" ).html( content );

			CreateSaveVideoLink();
			resizeVideo();
		}

		function setupShowMoreButton() {
			$reader.find( ".rss-show-more" ).on( "click", function () {
				var last, divs, $button, i, entry, link, dateStr, title;

				divs = "";
				$button = $( this );
				last = parseInt( $button[ 0 ].dataset.last );
				for( i = last; i < last + maxVideos && i < videos.length; i += 1 ) {
					entry = videos[ i ];
					link = entry.link;
					dateStr = Util.formatDate( new Date( entry.published ) );
					title = entry.title;
					divs += createVideoDiv( dateStr, link, title );
				}
				$( ".rss-channels-view .rss-videos" ).append( divs );
				resizeVideo();
				$button[ 0 ].dataset.last = i;
				if( videos.length > i ) {
					$button.show();
				} else {
					$button.hide();
				}
			} );
		}

		function createVideoDiv( dateStr, link, title ) {
			return "" +
				"<div class='rss-video'>" +
					"<span class='rss-video-date'>" + dateStr + "</span>" +
					"<input type='button' class='rss-save-btn' value='Save Video' data-src='" +
						link + "'" + " data-title='" + title + "'/>" +
					"<input type='button' class='rss-open-btn' value='Open Video' data-src='" +
						link + "'" + " data-title='" + title + "'/>" +
					"<br />" +
					"<a href='" + link + "' target='_blank'>" + title + "</a>" +
					"<br />" +
					"<iframe src='" + Util.parseVideoUrl( link ) + "'></iframe>" +
				"</div>";
		}

		function updateSettingsTab() {
			var settingsContent, categoriesContent, channelsContent, i, selCategory, lastId;

			lastId = 0;
			selCategory = "<select>";
			categoriesContent = "";
			for( i = 0; i < settings.categories.length; i++ ) {
				categoriesContent += "" +
					"<div data-category='" + settings.categories[ i ] + "'>" +
						"<input type='text' value='" + settings.categories[ i ] + "' />" +
						"<input class='update-category' type='button' value='Update' />" +
						"<input class='delete-category' type='button' value='Delete' />" +
					"</div>";
				selCategory += "<option>" + settings.categories[ i ] + "</option>";
			}
			selCategory += "</select>";
			categoriesContent += "" +
				"<div>" +
					"<label>Create New:</label>" +
					"<br />" +
					"<input type='text' value='' />" +
					"<input class='create-category' type='button' value='Create' />" +
				"</div>";

			channelsContent = "";
			for( i = 0; i < settings.channels.length; i++ ) {
				if( settings.channels[ i ].id ) {
					lastId = parseInt( settings.channels[ i ].id );
				}
			}

			for( i = 0; i < settings.channels.length; i++ ) {
				if( ! settings.channels[ i ].id ) {
					lastId += 1;
					settings.channels[ i ].id = lastId;
				}
				channelsContent += "" +
					"<div class='set-channel' data-channel='" + settings.channels[ i ].id + "'>" +
						"<div style='width: calc(100% - 70px);'>" +
							"<div>" +
								"<label>Title:</label>" +
								"<input class='set-title' type='text' value='" + settings.channels[ i ].title + "' />" +
							"</div>" +
							"<div>" +
								"<label>Category:</label>" +
								selCategory.replace(
									"<option>" + settings.channels[ i ].category + "</option>",
									"<option selected>" + settings.channels[ i ].category + "</option>"
								) +
							"</div>" +
							"<div>" +
								"<label>Link:</label>" +
								"<input class='set-link' type='text' value='" + settings.channels[ i ].link + "' />" +
							"</div>" +
						"</div>" +
						"<div>" +
							"<input class='update-channel' type='button' value='Update' /><br />" +
							"<input class='delete-channel' type='button' value='Delete' />" +
						"</div>" +
					"</div>";
			}

			settingsContent = "" +
				"<h2>Categories</h2>" +
				"<div class='rss-settings-categories'>" +
					categoriesContent +
				"</div>" +
				"<h2>Channels</h2>" +
				"<div class='rss-settings-channels'>" +
					channelsContent +
				"</div>";

			$reader.find( ".rss-settings" ).html( settingsContent );

			$reader.find( ".update-channel" ).on( "click", function () {
				var category, title, link, channelId, $container;

				$container = $( this ).closest( ".set-channel" );
				channelId = parseInt( $container[ 0 ].dataset.channel );
				category = $container.find( "select" ).val();
				title = $container.find( ".set-title" ).val();
				link = $container.find( ".set-link" ).val();

				for( i = 0; i < settings.channels.length; i++ ) {
					if( settings.channels[ i ].id === channelId ) {
						settings.channels[ i ].category = category;
						settings.channels[ i ].title = title;
						settings.channels[ i ].link = link;
						break;
					}
				}
				process.writeFile(
					settingsFilename, "data", JSON.stringify( settings ), null, true
				);
				updateFilters( $reader, settings );
			} );

			$reader.find( ".delete-channel" ).on( "click", function () {
				var channelId;

				channelId = parseInt( $( this ).closest( ".set-channel" )[ 0 ].dataset.channel );

				for( i = 0; i < settings.channels.length; i++ ) {
					if( settings.channels[ i ].id === channelId ) {
						settings.channels.splice( i, 1 );
						break;
					}
				}
				$( this ).closest( ".set-channel" ).remove();
				process.writeFile(
					settingsFilename, "data", JSON.stringify( settings ), null, true
				);
				updateFilters( $reader, settings );
			} );

			$reader.find( ".update-category" ).on( "click", function () {
				var oldCategory, category, i;

				oldCategory = $( this ).parent()[ 0 ].dataset.category;
				category = $( this ).parent().find( "input[type='text']" ).val();
				for( i = 0; i < settings.categories.length; i++ ) {
					if( settings.categories[ i ] === oldCategory ) {
						settings.categories[ i ] = category;
						break;
					}
				}
				process.writeFile(
					settingsFilename, "data", JSON.stringify( settings ), null, true
				);
				updateFilters( $reader, settings );
				updateSettingsTab();
			} );

			$reader.find( ".delete-category" ).on( "click", function () {
				var category, i;

				category = $( this ).parent()[ 0 ].dataset.category;
				for( i = 0; i < settings.categories.length; i++ ) {
					if( settings.categories[ i ] === category ) {
						settings.categories.splice( i, 1 );
						break;
					}
				}
				for( i = 0; i < settings.channels.length; i++ ) {
					if( settings.channels[ i ].category === category ) {
						settings.channels[ i ].category = "";
					}
				}
				process.writeFile(
					settingsFilename, "data", JSON.stringify( settings ), null, true
				);
				updateFilters( $reader, settings );
				updateSettingsTab();
			} );

			$reader.find( ".create-category" ).on( "click", function () {
				var category;

				category = $( this ).parent().find( "input[type='text']" ).val();
				settings.categories.push( category );
				process.writeFile(
					settingsFilename, "data", JSON.stringify( settings ), null, true
				);
				updateFilters( $reader, settings );
				updateSettingsTab();
			} );
		}
	}

} )();

Command.AddProgram(
	"rss-reader", "Channel Tracker", RssReader.start, "url(data/img/icons/video.png)",
	"Allows you to view Youtube RSS feeds."
);
