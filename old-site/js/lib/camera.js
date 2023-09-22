function Camera(canvas)
{
	this.yaw = 0;
	this.pitch = 0;
	this.position = vec3.create();
	this.target = vec3.create();
	this.target[2] = 1;
	this.targets;
	this.targetRadius = 1;
	this.zoom = 100;
	this.angle = 0;
	this.h = 0;
	this.mode = "look";
	
	this.UpdateFree = function (x, y, h, isLeftClick) {
		if(isLeftClick)
		{
			this.pitch -= y / (canvas.height * .5);
			this.yaw -= x / (canvas.width * .5);
			
			if(this.pitch < -1.5)
				this.pitch = -1.5;
			if(this.pitch > 1.5)
				this.pitch = 1.5;
			
			if(this.yaw > Math.PI)
				this.yaw = -Math.PI + this.yaw % (Math.PI);
			if(this.yaw < -Math.PI)
				this.yaw = Math.PI - this.yaw % (Math.PI);
				
			this.RoundNumbers();
			this.UpdateFreeTarget();
		}
		else if(h != 0)
		{
			var mvMatrix = mat4.create();
			mat4.identity(mvMatrix);
			mat4.rotateY(mvMatrix, this.yaw);
			mat4.rotateX(mvMatrix, this.pitch);
			
			var vecDir = vec3.create();
			vecDir[0] = 0;
			vecDir[1] = 0;
			vecDir[2] = 1;
			mat4.multiplyVec3(mvMatrix, vecDir);
			vec3.normalize(vecDir);
			
			this.position[0] += h * vecDir[0];
			this.position[1] += h * vecDir[1];
			this.position[2] += h * vecDir[2];
			this.target[0] = this.position[0] - vecDir[0];
			this.target[1] = this.position[1] - vecDir[1];
			this.target[2] = this.position[2] - vecDir[2];
			//document.getElementById("div_stats2").innerHTML = vec3.str(vecDir);
		}
		else
		{
			var mvMatrix = mat4.create();
			mat4.identity(mvMatrix);
			mat4.rotateY(mvMatrix, this.yaw);
			mat4.rotateX(mvMatrix, this.pitch);
			var x2 = x / 10;
			var y2 = y / 10;
			var vecDir = vec3.create();
			vecDir[0] = x2;
			vecDir[1] = -y2;
			vecDir[2] = 0;
			mat4.multiplyVec3(mvMatrix, vecDir);
			vec3.normalize(vecDir);
			var d = Math.sqrt(x2 * x2 + y2 * y2);
			this.position[0] += d * vecDir[0];
			this.position[1] += d * vecDir[1];
			this.position[2] += d * vecDir[2];
			
			this.UpdateFreeTarget();
			//document.getElementById("div_stats2").innerHTML = vec3.str(vecDir);
		}
		
	};
	
	this.UpdateFreeTarget = function () {
		var mvMatrix = mat4.create();
		mat4.identity(mvMatrix);
		mat4.rotateY(mvMatrix, this.yaw);
		mat4.rotateX(mvMatrix, this.pitch);
		
		var vecDir = vec3.create();
		vecDir[0] = 0;
		vecDir[1] = 0;
		vecDir[2] = 1;
		mat4.multiplyVec3(mvMatrix, vecDir);
		vec3.normalize(vecDir);
		this.target[0] = this.position[0] - vecDir[0];
		this.target[1] = this.position[1] - vecDir[1];
		this.target[2] = this.position[2] - vecDir[2];
	};
	
	this.UpdateLookAt = function (x, y, h, isLeftClick) {
		var mvMatrix = mat4.create();
		mat4.identity(mvMatrix);
		
		this.angle -= x / 500;
		this.zoom += y / 10;		
		if(this.zoom < (this.targetRadius * 2))
			this.zoom = this.targetRadius * 2;
			
		this.h += h * (this.zoom / 50);		
	};
	
	this.GetMatrixLookAt = function() {	
		
		var cm = CalcCenterOfMass(this.targets);
					
		this.target[0] = cm.x;
		this.target[1] = cm.y;
		this.target[2] = cm.z;	
		
		this.position[0] = this.target[0] + Math.sin(this.angle) * this.zoom;
		this.position[1] = this.target[1] + this.h;
		this.position[2] = this.target[2] + Math.cos(this.angle) * this.zoom;
		var mvMatrix = mat4.create();
		mat4.identity(mvMatrix);
		return mat4.lookAt(this.position, this.target, [0, 1, 0], mvMatrix); 
	};
	
	this.GetMatrixFree = function() {
		var mvMatrix = mat4.create();
		mat4.identity(mvMatrix);		
		//mat4.rotateX(mvMatrix, -this.pitch);
		//mat4.rotateY(mvMatrix, -this.yaw);
		//mat4.translate(mvMatrix, [-this.position[0], -this.position[1], -this.position[2]]);
		//return mvMatrix;	
		
		return mat4.lookAt(this.position, this.target, [0, 1, 0], mvMatrix); 
	};
	
	this.SetLookAtMode = function (targets, targetRadius) {
		this.mode = "look";
		this.targets = targets;
		this.targetRadius = targetRadius;
		this.Update = this.UpdateLookAt;
		this.GetMatrix = this.GetMatrixLookAt;
	};
	
	this.UpdateTarget = function (targets, targetRadius) {
		this.targets = targets;
		this.targetRadius = targetRadius;
	};
	
	this.SetFreeMode = function () {
		this.mode = "free";
		this.Update = this.UpdateFree;
		this.GetMatrix = this.GetMatrixFree;
		
		var vecDir = vec3.create();
		vec3.direction(this.position, this.target, vecDir);
		
		this.yaw = Math.atan2(vecDir[0], vecDir[2]);
		this.pitch = -Math.atan2(vecDir[1], Math.sqrt(vecDir[0] * vecDir[0] + vecDir[2] * vecDir[2]));
		this.RoundNumbers();
		this.Update(0, 0, 0);
	};
	
	this.RoundNumbers = function()
	{
		this.yaw = Math.round(this.yaw * 1000) / 1000;
		this.pitch = Math.round(this.pitch * 1000) / 1000;
	};
	
	this.Update = this.UpdateLookAt;
	this.GetMatrix = this.GetMatrixLookAt;
	
	this.Update(0, 0, 0);
}