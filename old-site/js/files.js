var FileSystem = (function () {
    
    var fileSystem = {
        name: "root",
        fileType: "folder",
        contents: []
    };
    
    var publicAPI = {
        createFile: createFile,
        getFolder: getFolder,
        moveFile: moveFile
    }
    
    return publicAPI;
    
    function createFile(path, fileData)
    {
        var folder = getFolder(path);
        if(folder)
        {
            fileData.path = path;
            folder.contents.push(fileData);
        }
    }
    
    function moveFile(pathDest, pathSrc)
    {
        var parts = pathSrc.split("/");
        var fileName = parts[parts.length - 1];
		var folderPathSrc = pathSrc.substring(0, pathSrc.length - fileName.length - 1);
        var folder = getFolder(folderPathSrc);
        var index = false;
        var file;
        for(var i = 0; i < folder.contents.length; i++)
        {
           if(folder.contents[i].name === fileName)
           {
               index = i;
               file = folder.contents[i];
           }
        }
        
        var folder2 = getFolder(pathDest);
        folder2.contents.push(file);
        
        folder.contents.splice(index, 1);
    }
    
    function getFile(path)
    {
        //Split the file into parts divided by slash
        var parts = path.split("/");
        var folder = fileSystem;
        for(var i = 0; i < parts.length; i++)
        {
            for(var j = 0; j < folder.contents.length; j++)
            {
                //On the last part doesn't need to be a folder
                if(i === parts.length - 1)
                {
                    if(folder.contents[j].name === parts[i])
                    {
                        return folder.contents[j];
                    }
                }
                else if(folder.contents[j].fileType === "folder" && folder.contents[j].name === parts[i])
                {
                    folder = folder.contents[j];
                    break;
                }
            }
        }
        
        return false;
    }
    
    function getFolder(path)
    {
        var check = "root";
        var parts = path.split("/");
        var folder = fileSystem;
        for(var i = 0; i < parts.length; i++)
        {
            for(var j = 0; j < folder.contents.length; j++)
            {
                if(folder.contents[j].fileType === "folder" && folder.contents[j].name === parts[i])
                {
                    check += "/" + folder.contents[j].name;
                    folder = folder.contents[j];
                    break;
                }
            }
        }
        
        if(check === path)
        {
            return folder;
        }
        else 
        {
            return false;
        }
    }
    
})();