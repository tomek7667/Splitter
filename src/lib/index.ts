import {
	FastaSequenceFile,
	FastqSequenceFile,
	FileExtension,
	FileExtensionHandler,
	GenbankSequencesFile,
} from "biotech-js";
import { dialog, shell } from "electron";
import { writeFileSync } from "fs";
import path from "path";

export const run = async (
	fileInputPath: string,
	outputSequenceFileLengthValue: number
) => {
	const fileExtension = fileInputPath.split(".").pop();
	const extension = FileExtensionHandler.fileExtensionToEnum(
		`.${fileExtension}`
	);
	const allSequences: { name: string; sequence: string }[] = [];
	switch (extension) {
		case FileExtension.Fasta: {
			const file = new FastaSequenceFile(fileInputPath);
			await file.process();
			const { sequences } = file;
			sequences.forEach(({ description, sequence }) => {
				allSequences.push({
					name: description,
					sequence,
				});
			});
			break;
		}
		case FileExtension.Fastq: {
			const file = new FastqSequenceFile(fileInputPath);
			await file.process();
			const { sequences } = file;
			sequences.forEach(
				({ sequence, sequenceIdentifier1, sequenceIdentifier2 }) => {
					allSequences.push({
						name: `${sequenceIdentifier1}:${sequenceIdentifier2}`,
						sequence,
					});
				}
			);

			break;
		}
		case FileExtension.Genbank: {
			const file = new GenbankSequencesFile(fileInputPath);
			await file.process();
			const { sequences } = file;
			sequences.forEach(({ Origin, Locus: { Name } }) => {
				allSequences.push({
					name: Name,
					sequence: Origin,
				});
			});
			break;
		}
		default:
			throw new Error("Invalid file extension");
	}
	const sequences: { name: string; sequence: string }[][] = [];
	for (
		let i = 0;
		i < allSequences.length;
		i += outputSequenceFileLengthValue
	) {
		sequences.push(
			allSequences.slice(i, i + outputSequenceFileLengthValue)
		);
	}

	const selectedPaths = dialog.showOpenDialogSync({
		title: "Select a folder to save the files in",
		message: "Select a folder to save the files in",
		properties: ["openDirectory"],
	});
	if (!selectedPaths || selectedPaths.length === 0) {
		throw new Error("No folder selected");
	}
	const [selectedPath] = selectedPaths;
	const outputPath = path.resolve(selectedPath);
	await Promise.all(
		sequences.map((sqs, index) => {
			const start = index * outputSequenceFileLengthValue;
			const end = start + outputSequenceFileLengthValue;
			const outputFilePath = path.join(
				outputPath,
				`${start}-${end}_${new Date().getTime()}.fasta`
			);
			saveFastaFile(sqs, outputFilePath);
		})
	);
	shell.openPath(outputPath);
};

export const saveFastaFile = (
	sequences: { name: string; sequence: string }[],
	filePath: string
) => {
	const content = sequences
		.map((sequence) => {
			// additionally remove all newlines
			let sequenceText = `>${sequence.name
				.replace(/\n/g, "")
				.replace(/\r/g, "")}\n`;
			for (let i = 0; i < sequence.sequence.length; i += 60) {
				sequenceText += sequence.sequence.slice(i, i + 60) + "\n";
			}
			return sequenceText;
		})
		.join("");

	writeFileSync(filePath, content);
};
