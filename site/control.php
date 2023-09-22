<?php

header( 'Content-Type: application/json' );

$mode = $_POST[ 'mode' ];

if( $mode === 'rss' ) {
	getRss();
} else {
	echo json_encode( 'Invalid Mode' );
}

function getRss() {

	$cacheFile = './cache/cache.json';
	$url = $_POST[ 'url' ];

	//logMsg( $url );

	// Cache refreshes every 900 seconds / 15 minutes
	$date = new DateTime();
	$cacheMod = floor( $date->getTimestamp() / 900 );
	$cacheLookup = $url . '_' . $cacheMod;

	// Load the cache file
	$cache = json_decode( file_get_contents( $cacheFile ), true );

	//logMsg( print_r( $cache ) );

	// Lookup cache
	$usingCache = false;
	if( array_key_exists( $cacheLookup, $cache ) ) {
		$url = './cache/' . $cache[ $cacheLookup ];
		$usingCache = true;
	}

	// xml loader
	$xmlDoc = new DOMDocument();

	// Turn off warnings because they will get echo'd to response
	//error_reporting( E_ALL ^ E_WARNING );

	//logMsg( $url );

	// Load the xml doc
	if( $xmlDoc->load( $url ) ) {

		// Convert to json string
		$xmlMsg = $xmlDoc->saveXML();
		$jsonMsg = json_encode( simplexml_load_string( $xmlMsg ) );

		// If we are not using cache then write to cache
		if( ! $usingCache ) {

			// Get the channel Id from the url
			$pos = strpos( $url, 'channel_id=' );
			if( $pos === false ) {
				$pos = strpos( $url, 'channel/' );
				if( $pos === false ) {
					$channelId = uniqid();
				} else {
					$channelId = substr( $url, $pos + 11 );
					$channelId = str_replace( '/', '', $channelId );
				}
			} else {
				$channelId = substr( $url, $pos + 11 );
			}

			// Write the xml contents to the cache
			file_put_contents( './cache/' . $channelId . '.xml', $xmlMsg );

			// Update the cache file
			$cache[ $cacheLookup ] = $channelId . '.xml';
			file_put_contents( $cacheFile, json_encode( $cache ) );
		}

		// Echo the response
		echo $jsonMsg;

	} else {
		echo json_encode( 'Invalid RSS URL' );
	}
}

function logMsg( $msg ) {
	$logData = file_get_contents( 'control.txt' );
	$logData .= $msg . "\n";
	file_put_contents( 'control.txt', $logData );
}
