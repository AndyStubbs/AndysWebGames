"use strict";

var About = ( function () {

	var publicAPI;

	publicAPI = {
		"start": start
	};

	return publicAPI;

	function start( params, process ) {
		var $about, contents, size;

		contents = "" +
			"<div class='about'>" +
				"<div>" +
					"Watch the below video for an overview of features. Or double click on the " +
					"help icon on the desktop for more information." +
				"</div>" +
				"<div>" +
					"Created by Andy Stubbs (" +
					"<a href='https://www.linkedin.com/in/andy-stubbs-04b9038a/' target='_blank'" +
					">LinkedIn</a> | " +
					"<a href='https://gitlab.com/astubbs50' target='_blank'>GitLab</a>" +
					"). " +
				"</div>" +
				"<div class='about-video'>" +
					//"<iframe src='https://rumble.com/embed/vaccft/?pub=a8xdb'></iframe>" +
					"<video src='http://www.andyswebgames.com/videos/awg.mp4' controls></video>" +
				"</div>" +
				"<div class='about-buttons'>" +
					"<input type='button' value='Ok' />" +
				"</div>" +
			"</div>";

		size = Util.getWindowSize();
		$about = WindowFactory.CreateWindow( {
			headerContent: "Andy's Web Games - Thank you for visiting!",
			bodyContent: contents,
			footerContent: "",
			toolbarContent: "",
			headerHeight: 31,
			footerHeight: 0,
			toolbarHeight: 0,
			width: 700,
			height: 530,
			left: size.width / 2 - 350,
			top: size.height / 2 - 300,
			minWidth: 400,
			minBodyHeight: 350,
			isFolder: false,
			icon: "url(data/img/icons/about.png)",
			name: "About"
		} );

		$about.find( ".about-buttons input[type='button']" ).on( "click", function () {
			WindowFactory.CloseWindow( $about );
		} );

		WindowFactory.SetOnWindowResizeEvent( $about, resizeVideo );

		resizeVideo();
		function resizeVideo() {
			var width, height;
			width = $about.width() - 40;
			height = ( width - 40 ) * 0.6;

			if( height > $about.height() - 180 ) {
				height = $about.height() - 180;
				width = height / 0.6;
			}

			if( width > $about.width() - 40 ) {
				width = $about.width() - 40;
				height = ( width - 40 ) * 0.6;
			}

			$about.find( "video" )
				.css( "width", width )
				.css( "height", height );
		}
	}

} )();

Command.AddProgram(
	"about", "About", About.start, "url(data/img/icons/about.png)",
	"An introduction message to Andy's Web Games."
);
