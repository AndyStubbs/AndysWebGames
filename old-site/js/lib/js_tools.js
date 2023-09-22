function Extend (target, source) 
{
    var a = Object.create(target);
    Object.keys(source).map(function (prop) {
        prop in a && (a[prop] = source[prop]);
    });
    return a;
}

var MyMath = (function ()
{
	var publicAPI = {		
		PI6: Math.PI / 6,					// 30 degrees
		PI4: Math.PI / 4,					// 45 degrees
		PI3: Math.PI / 3,					// 60 degrees
		PI2: Math.PI / 2,					// 90 degrees
		TWOPI3: 2 / (Math.PI * 3),			// 120 degrees
		THREEPI4: 3 / (Math.PI * 4),		// 135 degrees
		FIVEPI6: 5 / (Math.PI * 6),			// 150 degrees
		SEVENPI6: 7 / (Math.PI * 6),		// 210 degrees
		FIVEPI4: 5 / (Math.PI * 4),			// 225 degrees
		FOURPI3: 4 / (Math.PI * 3),			// 240 degrees
		THREEPI2: (3 * Math.PI) / 2,		// 270 degrees
		FIVEPI3: 5 / (Math.PI * 3),			// 300 degrees
		SEVENPI4: 7 / (Math.PI * 4),		// 315 degrees
		ELEVENPI6: 11 / (Math.PI * 6),		// 330 degrees		
		TWOPI: 2 * Math.PI,					// 360 degrees
		RAD2DEG: 180 / Math.PI,
		DEG2RAD: Math.PI / 180
	};
	
	return publicAPI
})();

function GetPageDimensions()
{
	var w = window,
    d = document,
    e = d.documentElement,
    g = d.body,
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
	
	return { width: x, height: y };
}

function GetRandomColor()
{
	var cTot = 0;
	while(cTot < 200)
	{
		var r = Math.floor(Math.random() * 256);
		var g = Math.floor(Math.random() * 256);
		var b = Math.floor(Math.random() * 256);
		cTot = r + g + b;
	}
	return "rgb(" + r + ", " + g + ", " + b + ")";
}

function Swap(obj1, obj2)
{
	var objc = obj1;
	obj1 = obj2;
	obj2 = objc;
}