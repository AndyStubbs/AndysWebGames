var ImageLoader = (function ()
{
	var images = [];
	var bImagesLoaded = false;
	var imagesLoaded = 0;
	var readyEvents = [];
	
	function LoadImage(src)
	{
		var image = new Image();
		image.src = src;
		image.onload = ImagesLoaded;
		images.push(image);
		bImagesLoaded = false;
		
		return images.length - 1;
	}

	function ImagesLoaded()
	{
		if(++imagesLoaded == images.length)
		{
			for(var i = 0; i < images.length; i++)
			{
				images[i].halfWidth = images[i].width / 2;
				images[i].halfHeight = images[i].height / 2;
			}
			bImagesLoaded = true;		
			OnReady();
		}
	}
	
	function IsReady()
	{
		return bImagesLoaded;
	}
	
	function GetImages()
	{
		return images;
	}
	
	function GetImage(index)
	{
		return images[index];
	}
	
	function RegisterOnReady(myEvent, isOneTime)
	{
		readyEvents.push({
			myEvent: myEvent,
			isOneTime: isOneTime
		});
	}
	
	function OnReady()
	{
		var removeEvents = [];
		for(var i = 0; i < readyEvents.length; i++)
		{
			var readyEvent = readyEvents[i];
			if(readyEvent.isOneTime)
				removeEvents.push(i);
				
			readyEvent.myEvent();
		}
		
		for(var i = removeEvents.length - 1; i >= 0; i--)
		{
			readyEvents.splice(removeEvents[i], 1);
		}
	}
	
	var publicAPI = {
		LoadImage: LoadImage,
		IsReady: IsReady,
		GetImages: GetImages,
		GetImage: GetImage,
		RegisterOnReady: RegisterOnReady
	};
	
	return publicAPI;
})();