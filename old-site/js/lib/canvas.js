var CanvasFactory = (function()
{
	var id = 0;
	var canvases = [];
	
	function create(options, element)
	{
		var defaults = {
			aspectWidth: 16 / 9,			
			visible: true,
			id: "canvas_" + (id++),
			fullscreen: false,
			fixedWidth: 0,
			fixedHeight: 0
		};
		
		var settings;
		
		if(options != null)
			settings = Extend(defaults, options);
		else
			settings = defaults;
		
		var canvas = document.createElement("canvas");
		canvas.id = settings.id;
		
		if(settings.visible)
		{
			if(element && !settings.fullscreen)
				element.appendChild(canvas);
			else
				document.body.appendChild(canvas);
			
			SetSize(canvas, settings);
		}
		
		var context = canvas.getContext("2d");
		
		var canvasData = {
			canvas: canvas,
			context: context,
			resize: Resize,
			settings: settings
		};
		
		canvases.push(canvasData);
		
		return canvasData;
	}
	
	function SetSize(canvas, settings)
	{
		if(settings.fullscreen)
		{
			canvas.style.width = "100%";
			canvas.style.height = "100%";
		}
		if(settings.aspectWidth && settings.aspectWidth > 0 && !settings.fixedWidth && !settings.fixedHeight)
		{
			SetAspect(canvas, settings.aspectWidth);
		}
		else if(!isNaN(settings.fixedHeight) && !isNaN(settings.fixedHeight))
		{
			settings.aspectWidth = settings.fixedWidth / settings.fixedHeight;
			SetAspect(canvas, settings.aspectWidth, settings.fixedWidth, settings.fixedHeight);
		}
		else
		{
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		}
	}
	
	function Resize()
	{
		SetSize(this.canvas, this.settings);
	}
	
	function SetAspect(canvas, aspectWidth, fixedWidth, fixedHeight)
	{	
		var canvasWidth = canvas.offsetWidth;	
		var canvasHeight = canvas.offsetHeight;
		
		var pageWidth = canvasWidth;
		var pageHeight = canvasHeight;
		var canvasTop = 0;
		var canvasLeft = 0;
			
		if(canvasWidth > canvasHeight)
		{		
			canvasWidth = Math.floor(canvasHeight * aspectWidth);
			if(canvasWidth > pageWidth)
			{			
				canvasHeight = Math.floor(pageWidth / aspectWidth);
				canvasWidth = Math.floor(canvasHeight * aspectWidth);
				canvasTop = Math.floor((pageHeight - canvasHeight) / 2);
			}
			canvasLeft = Math.floor((pageWidth - canvasWidth) / 2);		
		}	
		else
		{
			canvasHeight = Math.floor(canvasWidth / aspectWidth);
			if(canvasHeight > pageHeight)
			{
				canvasWidth = Math.floor(pageWidth * aspectWidth);
				canvasHeight = Math.floor(canvasWidth / aspectWidth);
				canvasLeft = Math.floor((pageWidth - canvasWidth) / 2);
			}
			canvasHeight = Math.floor(canvasWidth / aspectWidth);
			canvasTop = Math.floor((pageHeight - canvasHeight) / 2);		
		}

		if(fixedWidth)
			canvas.width = fixedWidth;
		else
			canvas.width = canvasWidth;
			
		if(fixedHeight)
			canvas.height = fixedHeight;
		else
			canvas.height = canvasHeight;
			
		canvas.style.width = canvasWidth + "px";
		canvas.style.height = canvasHeight + "px";
		canvas.style.top = canvasTop + "px";
		canvas.style.left = canvasLeft + "px";
	}
	
	function GetCanvas(index)
	{
		return canvases[index];
	}
	
	var publicAPI = {
		create: create,
		GetCanvas: GetCanvas
	};
	
	return publicAPI;
})();