"use strict";

if ( ! Array.isArray ) {
	Array.isArray = function( arg ) {
		return Object.prototype.toString.call( arg ) === '[object Array]';
	};
}

var Util = ( function () {

	var publicAPI, logger, logMsg, logMsgAll, isLogging, m_isMobile;

	logger = console.log;
	logMsg = "";
	logMsgAll = "";
	isLogging = true;

	//Provides access to methods in the WindowsFactory
	publicAPI = {
		"copyObject": copyObject,
		"matchWildcard": matchWildcard,
		"log": log,
		"getLog": getLog,
		"clearLog": clearLog,
		"setLogMode": setLogMode,
		"toggleLogging": toggleLogging,
		"getWindowSize": getWindowSize,
		"parseVideoUrl": parseVideoUrl,
		"formatDate": formatDate,
		"isMobile": isMobile
	};

	return publicAPI;

	function copyObject( dest, src ) {
		var prop;
		for( prop in src ) {
			if( src.hasOwnProperty( prop ) ) {
				dest[ prop ] = src[ prop ];
			}
		}
	}

	function matchWildcard( str, rule ) {

		// for this solution to work on any string, no matter what characters it has
		var escapeRegex = ( str ) => str.replace( /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1" );

		// "."  => Find a single character, except newline or line terminator
		// ".*" => Matches any string that contains zero or more characters
		rule = rule.split( "*" ).map( escapeRegex ).join( ".*" );

		// "^"  => Matches any string with the following at the beginning of it
		// "$"  => Matches any string with that in front at the end of it
		rule = "^" + rule + "$"

		//Create a regular expression object for matching string
		var regex = new RegExp( rule );

		//Returns true if it finds a match, otherwise it returns false
		return regex.test( str );

	}

	function toggleLogging( isSet ) {
		if( isSet === true ) {
			isLogging = true;
		} else if( isSet === false ) {
			isLogging = false;
		} else {
			isLogging = ! isLogging;
		}
	}

	function setLogMode( mode ) {
		if( mode === "console" ) {
			logger = console.log;
		} else if( mode === "string" ) {
			logger = logString;
		} else if( mode === "null" ) {
			logger = logNull;
		}
	}

	function logNull( msg ) {}

	function logString( msg ) {
		logMsg += msg + "\n";
		logMsgAll += msg + "\n";
		console.log( msg );
	}

	function log( msg ) {
		if( isLogging ) {
			logger( msg );
		}
	}

	function clearLog() {
		logMsg = "";
	}

	function getLog() {
		return logMsg;
	}

	function getWindowSize() {
		var width, height;

		width = window.innerWidth || document.documentElement.clientWidth ||
			document.body.clientWidth;

		height = window.innerHeight || document.documentElement.clientHeight ||
			document.body.clientHeight;

		return {
			"width": width,
			"height": height
		};
	}

	function parseVideoUrl( videoUrl ) {

		// https://www.bitchute.com/feeds/rss/channel/Styxhexenhammer666/

		if( videoUrl.indexOf( "youtube.com" ) > -1 && videoUrl.indexOf( "watch?v=" ) > - 1 ) {

			// Change link to embeded
			videoUrl = videoUrl.replace( "watch?v=", "embed/" );

			// Remove any modifiers
			if( videoUrl.indexOf( "&" ) > -1 ) {
				videoUrl = videoUrl.substring( 0, videoUrl.indexOf( "&" ) );
			}

		}

		// if( videoSrc.indexOf( "rumble.com" ) > -1 && videoSrc.indexOf( "/embed/" ) === -1 ) {
		// 	videoSrc = "";
		// }

		return videoUrl;
	}

	function formatDate( date ) {
		var d, month, day, year

		d = new Date( date );
		month = '' + ( d.getMonth() + 1 );
		day = '' + d.getDate();
		year = d.getFullYear();

		if( month.length < 2 ) {
			month = '0' + month;
		}
		if( day.length < 2 ) {
			day = '0' + day;
		}

		return month + "/" + day + "/" + year;
	}

	function isMobile() {
		var match, mq;

		if( m_isMobile !== undefined ) {
			return m_isMobile;
		}
		match = window.matchMedia || window.msMatchMedia;
		if( match ) {
			mq = match( "(pointer:coarse)" );
			m_isMobile = mq.matches;
		} else {
			m_isMobile = false;
		}
		return m_isMobile;
	}

} ) ();
