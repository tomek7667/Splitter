import { ipcRenderer } from "electron";

export const blockElement = (element: HTMLElement) => {
	element.classList.add("is-disabled");
	element.classList.add("disabled");
	element.classList.add("is-loading");
	if (element instanceof HTMLInputElement) {
		element.disabled = true;
	}
};

export const unblockElement = (element: HTMLElement) => {
	element.classList.remove("is-disabled");
	element.classList.remove("disabled");
	element.classList.remove("is-loading");
	if (element instanceof HTMLInputElement) {
		element.disabled = false;
	}
};

let fileInputPath = "";
let outputSequenceFileLengthValue: number;

window.addEventListener("DOMContentLoaded", () => {
	const fileInput = document.getElementById("sequence-file-input");
	const outputSequenceFileLength = document.getElementById(
		"output-sequence-length-input"
	);
	const sequencePathInputLabel = document.getElementById(
		"sequence-file-label"
	);
	const splitButton = document.getElementById("split-button");

	fileInput.addEventListener("change", (event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files[0];
		if (file) {
			sequencePathInputLabel.innerText = file.name;
			fileInputPath = file.path;
		}
	});

	outputSequenceFileLength.addEventListener("input", (event) => {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		if (value) {
			target.value = value.replace(/\D/g, "");
			outputSequenceFileLengthValue = parseInt(target.value);
		}
	});

	splitButton.addEventListener("click", () => {
		if (fileInputPath && outputSequenceFileLengthValue) {
			blockElement(splitButton);
			ipcRenderer.send("run", {
				fileInputPath,
				outputSequenceFileLengthValue,
			});
		} else {
			alert("Please select a file and set the output sequence length");
		}
	});

	ipcRenderer.send("getAppVersion");

	ipcRenderer.on("appVersion", (event, appVersion) => {
		document.getElementById("title").innerText = `Splitter ${appVersion}`;
	});

	ipcRenderer.on("run", (event, args) => {
		const { success, errorMessage } = args;
		if (!success && errorMessage) {
			alert(errorMessage);
		}
		if (success) {
			alert("Successfully finished");
		}
		unblockElement(splitButton);
	});
});
