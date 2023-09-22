/* global WindowFactory */
/* global IconFactory */
/* global Notepad */
/* global FileSystem */

var bAutoSizeDetected = false;

$(document).ready( function () {

	detectFeatures();
	WindowFactory.Init();
	IconFactory.Init();
	
	FileSystem.createFile("root", {
		name: "Apps",
		contents: [],
		fileType: "folder",
		iconImage: "url(img/icon_folder.png)"
	});
	
	FileSystem.createFile("root", {
		name: "Documents",
		contents: [],
		fileType: "folder",
		iconImage: "url(img/icon_folder.png)"
	});
	
	FileSystem.createFile("root", {
		name: "Graphics Demos",
		contents: [],
		fileType: "folder",
		iconImage: "url(img/icon_folder.png)"
	});
	
	FileSystem.createFile("root/Apps", {
		name: "Notepad",
		contents: Notepad.start,
		fileType: "program",
		iconImage: "url(img/icon_notebook.png)"
	});
	
	FileSystem.createFile("root/Documents", {
		name: "Photos",
		contents: [],
		fileType: "folder",
		iconImage: "url(img/icon_folder.png)"
	});
	
	FileSystem.createFile("root/Documents/Photos", {
		name: "Crater Lake",
		contents: "a001.png",
		fileType: "image",
		iconImage: "url(img/icon_photo.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Gravity",
		contents: "http://www.andyswebgames.com/apps/gravity",
		fileType: "link",
		iconImage: "url(img/planets_small.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Land",
		contents: "http://www.andyswebgames.com/apps/land",
		fileType: "link",
		iconImage: "url(img/land_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Star",
		contents: "http://www.andyswebgames.com/apps/star",
		fileType: "link",
		iconImage: "url(img/star_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Illusion",
		contents: "http://www.andyswebgames.com/apps/illusion",
		fileType: "link",
		iconImage: "url(img/illusion_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Wind",
		contents: "http://www.andyswebgames.com/apps/wind",
		fileType: "link",
		iconImage: "url(img/wind_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Flag",
		contents: "http://www.andyswebgames.com/apps/flag",
		fileType: "link",
		iconImage: "url(img/flag_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "3D Texture",
		contents: "http://www.andyswebgames.com/apps/3d_textures",
		fileType: "link",
		iconImage: "url(img/3d_textures_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Mandelbrot",
		contents: "http://www.andyswebgames.com/apps/mandelbrot",
		fileType: "link",
		iconImage: "url(img/mandelbrot_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Blocks",
		contents: "http://www.andyswebgames.com/apps/blocks",
		fileType: "link",
		iconImage: "url(img/blocks_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Intel Wave",
		contents: "http://www.andyswebgames.com/apps/intel_wave",
		fileType: "link",
		iconImage: "url(img/intel_icon.png)"
	});
	
	FileSystem.createFile("root/Graphics Demos", {
		name: "Island",
		contents: "http://www.andyswebgames.com/apps/island",
		fileType: "link",
		iconImage: "url(img/island_icon.png)"
	});
	
	FileSystem.createFile("root", {
		name: "Games",
		contents: [],
		fileType: "folder",
		iconImage: "url(img/icon_folder.png)"
	});
	
	FileSystem.createFile("root/Games", {
		name: "Maze Up",
		contents: "http://www.andyswebgames.com/games/maze_up",
		fileType: "link",
		iconImage: "url(img/maze_up_icon.png)"
	});
	
	FileSystem.createFile("root/Games", {
		name: "Space",
		contents: "http://www.andyswebgames.com/games/space",
		fileType: "link",
		iconImage: "url(img/space_ship_icon.png)"
	});
	
	FileSystem.createFile("root/Games", {
		name: "Shooter",
		contents: "http://www.andyswebgames.com/games/shooter",
		fileType: "link",
		iconImage: "url(img/space_ship2_icon.png)"
	});

	FileSystem.createFile("root/Games", {
		name: "Pacman",
		contents: "http://www.andyswebgames.com/games/pacman",
		fileType: "link",
		iconImage: "url(img/pacman_icon.png)"
	});
	
	FileSystem.createFile("root/Games", {
		name: "Bites",
		contents: "http://www.andyswebgames.com/games/bites",
		fileType: "link",
		iconImage: "url(img/bites_icon.png)"
	});	
	
	openFolder("root", $(document.body));
	
	function detectFeatures()
	{
		//Detect auto size on canvas
		var $canvas = $("<canvas class='canvasLayerView'>");
		$(document.body).append($canvas);
		$canvas[0].width = 500;
		$canvas[0].height = 300;
		
		var ratio = $canvas[0].height / $canvas[0].width;
		
		$canvas.width("600");	
		
		setTimeout(function () {
			
			var checkHeight = Math.round($canvas.width() * ratio);
			bAutoSizeDetected = $canvas.height() == checkHeight;			
			$canvas.remove();
		}, 10);
	}
	
	function openFolder(path, $folder)
	{
		var files = FileSystem.getFolder(path);
		for(var i = 0; i < files.contents.length; i++)
		{
			var item = files.contents[i];
			
			var dblClickSetting;
			if(item.fileType === "folder")
			{
				dblClickSetting = setOpenFolder(item.path + "/" + item.name, item.name);
			}
			else if(item.fileType === "program")
			{
				dblClickSetting = item.contents;
			}
			else if(item.fileType === "image")
			{
				dblClickSetting = setOpenImage(item.path + "/" + item.name, item.name, item.contents);
			}
			else if(item.fileType === "link")
			{
				dblClickSetting = setOpenLink(item.path + "/" + item.name, item.name, item.contents);
			}
			
			IconFactory.CreateIcon($folder, {
				image: item.iconImage, 
				name: item.name,
				path: item.path,
				dblClick: dblClickSetting
			});
		}
	}
	
	function setOpenFolder(path, name)
	{
		return function () {
			
			var openWindows = WindowFactory.GetOpenWindows();
			var windowAlreadyOpen = false;
			var index = -1;
			for(var i = 0; i < openWindows.length; i++)
			{
				if(openWindows[i].$window.data("options").name === name)
				{
					windowAlreadyOpen = true;
					index = i;
					break;
				}
			}
			
			if(windowAlreadyOpen)
			{
				WindowFactory.IconButtonClick.call(openWindows[index].$icon);
			}
			else
			{
				var $folder = WindowFactory.CreateWindow({
					headerContent: name, 
					bodyContent: "", 
					footerContent: "",
					headerHeight: 31,
					footerHeight: 0,
					left: 250,
					top: 150,
					width: 500,
					height: 350,
					bFolder: true,
					path: path,
					icon: "url(img/icon_folder.png)",
					name: name
				});
				openFolder(path, $folder);
			}
		};
	}
	
	function setOpenImage(path, name, imageName)
	{
		return function () {
			var $image = WindowFactory.CreateWindow({
				headerContent: name, 
				bodyContent: "", 
				footerContent: "",
				headerHeight: 31,
				footerHeight: 0,
				left: 250,
				top: 150,
				width: 500,
				height: 350,
				bFolder: false,
				icon: "url(img/icon_photo.png)",
				name: name
			});
			
			//rl(images/bg.jpg) no-repeat center center fixed;
			$image.find(".windowBody")
				.css("background", "url(img/" + imageName + ") no-repeat")
				.css("background-size", "100% auto");
		};
	}
	
	function setOpenLink(path, name, link)
	{
		return function () {
			window.open(link);
		};
	}
	
});
