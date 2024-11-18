# Andy's Web Games

Welcome to AndysWebGames, a virtual operating system inspired by the classic Windows 9x era! This web-based OS hosts a portfolio of projects, including apps, games, and tools. Interact with it just like a real operating system—using a mouse and keyboard—featuring a taskbar, desktop icons, and draggable windows.

---

## Features

- **Desktop Environment**: 
	- Drag and drop files to organize them.
	- Auto-align files in a grid on the desktop or within folders.
	- Double-click files and folders to open them in resizable, draggable windows.
	- Taskbar for easy navigation of open apps and windows.

- **Context Menu**: Right-click for quick access to options like settings, creating files, and managing the desktop.

- **Local Storage**: Save your workspace and files persistently within the browser, even after refreshing or revisiting the site.

- **Apps and Utilities**:
	- **Channel Tracker**: Track and organize YouTube and Bitchute videos.
	- **Console**: Manage files with powerful command-line tools.
	- **Settings**: Customize desktop appearance, reset data, and manage uploads.

- **File Types**:
	- **Script**: Execute commands or launch apps.
	- **Text**: Create and view notes.
	- **Picture**: Import and set images as desktop backgrounds.
	- **Link**: Save and open web links.
	- **Folder**: Organize files into folders.
	- **Video**: Play embedded videos.
	- **Data**: Store app-specific settings and data.

---

## View it Online
You can visit my website by visiting the following link:
[Andy's Web Games](https://www.andyswebgames.com)

---

## How to Use

### Desktop Interaction
- **Move Files**: Drag and drop to organize.
- **Open Files and Folders**: Double-click to open in a window.
- **Window Management**: Resize, minimize, and maximize windows like a traditional OS.

### Context Menu
Right-click to access specialized menus:
- **Desktop**: Open settings, create new files, or launch the console.
- **File/Folder**: Open, edit, cut, copy, or delete items.
- **Picture Files**: Set as background directly from the menu.

---

## Key Applications

### Channel Tracker
Track and view videos from YouTube and Bitchute channels.
- **Add Channels**: Input URLs or channel IDs to add feeds.
- **View Channels**: Browse videos by category and date.
- **Settings**: Manage channels and categories.
- **Data Management**: Load, save, and edit tracker data files.

### Console
A command-line tool for managing files.
- **Commands**: Use commands like `dir`, `ls`, `mkdir`, and more.
- **Interactive Links**: Open files and folders directly from the console.

### Settings
Customize your virtual desktop.
- **Background**: Set images or colors, and choose display modes (contain, cover, centered, tiled).
- **Data Management**: Save, load, or reset workspace data.
- **Uploads**: Manage uploaded files to free up space.

---

## Storage and File Management

- **Local Storage**: Automatically saves files and configurations within your browser.
- **File Import**: Drag and drop images, text files, or bookmarks onto the desktop.
- **Limitations**: Storage is capped at approximately 10 MB. Large image uploads may quickly use up this space.

---

## Mobile Support

The OS is primarily designed for desktop browsers. You may be able to do a few things on mobile but
I don't recommend it.

---

## Setting Up and Running Locally

To run AndysWebGames locally, you only need to have a server running locally. Channel tracker app
requires PHP to run, but everything else should work with node.

Follow these steps to run using Node.js as local server:

### Prerequisites
- Node.js installed on your machine.

### Installation
1. Clone the repository:
```
git clone https://github.com/AndyStubbs/AndysWebGames
cd AndysWebGames
npm install
```

2. Running the Game
```npm start```

3. Open your web browser and navigate to:
```http://localhost:8080/site/```