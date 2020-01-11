interface IListHelper {
    command: string;
    description: string;
}

class Shell {
    private commands: string[] = ["ls", "help", "cd", "clear", "cat"];
    private currentDirectory: string[] = ["root"];
    private shell: HTMLDivElement = document.querySelector(".shell__body");
    private shellInput: HTMLInputElement = document.querySelector(
        ".shell__input input",
    );

    private folders = {};
    private listHelper: IListHelper[] = [
        {
            command: "ls",
            description: "List files and folders directory on terminal",
        },
        {
            command: "cat",
            description: "Open file",
        },
        {
            command: "cd",
            description: "Switch directory",
        },
        {
            command: "clear",
            description: "Clear terminal",
        },
    ];
    private directorysAndArchives: any;
    private filesContent: any;

    constructor() {
        this.addListenerInputShell();
        this.onClickShell();
        this.getFilesAndFolder();
        this.getFilesContent();
    }

    private async getFilesAndFolder(): Promise<void> {
        const res = await fetch("data/directorys.json");
        const data = await res.json();

        this.directorysAndArchives = data;

        this.getFolderAndFilesAccordingDirectory();
    }

    private async getFilesContent(): Promise<void> {
        const res = await fetch("data/files.json");
        const data = await res.json();

        this.filesContent = data;
    }

    private addListenerInputShell(): void {
        this.shell.addEventListener("keydown", (event) => {
            if (event.keyCode === 9) {
                event.preventDefault();
            }

            if (event.ctrlKey && event.key === "c") {
                this.updateCommandShell();
            }
            if (event.key === "Enter") {
                this.actionsInput();
            }
        });
    }

    private actionsInput(): void {
        const formatInput = this.getValueInput().replace(/( ).*/, "");
        const commandSelected =
            this.commands.find((command) => command === formatInput) || "";

        switch (commandSelected) {
            case "cd":
                const folder = this.getValueInput().replace("cd ", "");

                if (folder === "..") {
                    this.returnDirectory();
                } else if (this.verifyFolder(folder)) {
                    this.enterInDirectory(folder);
                } else {
                    this.shellCommandError("Folder not found");
                }
                break;
            case "ls":
                this.listDirectorysAndArchives();
                break;
            case "help":
                this.listItemsHelper();
                break;
            case "clear":
                this.clearShell();
                break;
            case "cat":
                const file = this.getValueInput().replace("cat ", "");
                this.readFile(file);
                break;
            default:
                this.shellCommandError();
                break;
        }
        this.updateCommandShell();
    }

    private verifyFolder(folder: string): boolean {
        const directory = this.currentDirectory[
            this.currentDirectory.length - 1
        ];
        return this.folders[directory].folders[folder] ? true : false;
    }

    private readFile(file: string): void {
        if (!this.filesContent.hasOwnProperty(file)) {
            this.shellCommandError("File not found");
            return;
        }

        if (!this.filesContent[file]) {
            this.shellCommandError("File not found");
            return;
        }

        if (
            this.currentDirectory.indexOf(this.filesContent[file].children) ===
            -1
        ) {
            this.shellCommandError("File not found");
            return;
        }

        const content = this.filesContent[file];
        const children = `
            ${content.html}
        `;
        this.insertBlockInShell("div", "shell__file-content", children);
    }

    private setAttributesInput(): void {
        this.shellInput.disabled = true;
        this.shellInput.setAttribute("value", this.shellInput.value);
        this.shellInput.dataset.disabled = "true";
    }

    private getValueInput(): string {
        return this.shellInput.value;
    }

    private clearShell(): void {
        this.shell.innerHTML = "";
    }

    private updateCommandShell(): void {
        this.setAttributesInput();
        this.shell.innerHTML += this.shellCommandHtml();
        this.shellInput = document.querySelector(
            ".shell__input input[data-disabled=false]",
        );
        this.inputFocus();
    }

    private shellCommandError(
        message: string = "Error: command not recognized",
    ): void {
        this.insertBlockInShell("div", "shell__error", message);
    }

    private onClickShell(): void {
        this.shell.addEventListener("click", () => {
            this.inputFocus();
        });
    }

    private inputFocus(): void {
        this.shellInput.focus();
    }

    private shellCommandHtml(): string {
        return `
            <div class="shell__command">
                <div class="shell__directory">Marlon@Franscisco:~/${
                    this.currentDirectory.length > 1
                        ? this.currentDirectory.join("/")
                        : ""
                }$</div>
                <div class="shell__input">
                    <input type="text" data-disabled="false"/>
                </div>
            </div>
        `;
    }

    private insertBlockInShell(
        element: string,
        className: string,
        children: string,
    ): void {
        const el = document.createElement(element);
        el.className = className;
        el.innerHTML = children;

        this.shell.appendChild(el);
    }

    private listDirectorysAndArchives(): void {
        const path = this.folders[
            this.currentDirectory[this.currentDirectory.length - 1]
        ];
        this.insertBlockInShell(
            "ul",
            "shell__list",
            `
                    ${Object.keys(path.folders).map(
                        (folder) => `<li class="folder">${folder}</li>`,
                    )}

                    ${path.files.map(
                        (file: string) => `<li class="file">${file}</li>`,
                    )}
                `,
        );
    }

    private listItemsHelper(): void {
        const children = `
            ${this.listHelper.map(
                (help) =>
                    `<li><span>${help.command}</span> - ${help.description}</li>`,
            )}
        `;

        this.insertBlockInShell("ul", "shell__helper-list", children);
    }

    private enterInDirectory(folder: string): void {
        this.currentDirectory.push(folder);
        this.getFolderAndFilesAccordingDirectory();
    }

    private returnDirectory(): void {
        if (this.currentDirectory.length > 1) {
            this.currentDirectory.splice(this.currentDirectory.length - 1, 1);
            this.getFolderAndFilesAccordingDirectory();
        } else {
            this.shellCommandError("You are in main directory");
        }
    }

    private getFolderAndFilesAccordingDirectory(
        directorys: string[] = this.currentDirectory,
        currentPath?: any,
    ): any {
        if (this.folders.hasOwnProperty(directorys[directorys.length - 1])) {
            return;
        }

        directorys.forEach((directory, index) => {
            if (currentPath) {
                this.folders[directory] = currentPath.folders[directory];
                return;
            }

            if (
                this.directorysAndArchives[directory] &&
                this.directorysAndArchives[directory].folders
            ) {
                this.folders[directory] = this.directorysAndArchives[directory];
                return;
            } else {
                const nextDirectorys = directorys.filter(
                    (value, i) => i >= index,
                );
                this.getFolderAndFilesAccordingDirectory(
                    nextDirectorys,
                    this.directorysAndArchives[directorys[index - 1]],
                );
                return;
            }
        });
    }
}

new Shell();
