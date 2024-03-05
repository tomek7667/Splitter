import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { run } from "./lib";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
	app.quit();
}

const createWindow = (): void => {
	const mainWindow = new BrowserWindow({
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
			nodeIntegration: true,
		},
		icon: path.join(__dirname, "images/favicon.png"),
	});

	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
	// mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.on("getAppVersion", (event) => [
	event.sender.send("appVersion", app.getVersion()),
]);

ipcMain.on(
	"run",
	async (
		event,
		{
			fileInputPath,
			outputSequenceFileLengthValue,
		}: { outputSequenceFileLengthValue: number; fileInputPath: string }
	) => {
		try {
			await run(fileInputPath, outputSequenceFileLengthValue);

			event.sender.send("run", {
				success: true,
				errorMessage: null,
			});
		} catch (err) {
			event.sender.send("run", {
				success: false,
				errorMessage: err?.message ?? err?.toString(),
			});
		}
	}
);
