var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Shell {
    constructor() {
        this.commands = ["ls", "help", "cd", "clear", "cat"];
        this.currentDirectory = ["root"];
        this.shell = document.querySelector(".shell__body");
        this.shellInput = document.querySelector(".shell__input input");
        this.folders = {};
        this.listHelper = [
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
        this.addListenerInputShell();
        this.onClickShell();
        this.getFilesAndFolder();
        this.getFilesContent();
        this.historyIndex = this.getHistoryIndex();
    }
    getHelpers() {
        const helpers = {
            commands: [],
            items: [],
        };
        const currentDirectory = this.getCurrentDirectory();
        const commandSelected = this.getValueInput().replace(/( ).*/, "");
        let valueSelected = this.getValueInput().replace(/.*( )/, "");
        valueSelected = valueSelected === commandSelected ? "" : valueSelected;
        helpers.commands =
            this.commands.indexOf(commandSelected) === -1
                ? this.commands.filter((command) => command.includes(commandSelected))
                : [];
        const allowCommands = ["cd", "cat"];
        if (allowCommands.indexOf(commandSelected) === -1) {
            return helpers;
        }
        helpers.items =
            commandSelected === "cd"
                ? Object.keys(currentDirectory.folders).filter((item) => item.includes(valueSelected))
                : currentDirectory.files.filter((item) => item.includes(valueSelected));
        return helpers;
    }
    getHistoryIndex() {
        return this.getHistory() ? this.getHistory().length - 1 : 0;
    }
    getHistory() {
        return JSON.parse(localStorage.getItem("history"));
    }
    setHistory(value) {
        localStorage.setItem("history", JSON.stringify(value));
    }
    historyPrev() {
        if (this.historyIndex === 0) {
            this.shellInput.value = this.getHistory()[this.historyIndex];
            return;
        }
        this.shellInput.value = this.getHistory()[this.historyIndex];
        this.historyIndex -= 1;
    }
    historyNext() {
        if (this.historyIndex === this.getHistoryIndex()) {
            this.shellInput.value = this.getHistory()[this.historyIndex];
            return;
        }
        this.historyIndex += 1;
        this.shellInput.value = this.getHistory()[this.historyIndex];
    }
    setAutocomplete() {
        const helpers = this.getHelpers();
        const children = `
            ${helpers.commands.length
            ? `
                <div>
                    <h3>Commands</h3>
                    <ul>
                        ${helpers.commands
                .map((command) => `<li>${command}</li>`)
                .join("")}
                    </ul>
                </div>
            `
            : ""}

            ${helpers.items.length
            ? `
                    <div>
                        <h3>Items</h3>
                        <ul>
                            ${helpers.items
                .map((item) => `<li>${item}${!item.includes(".") ? "/" : ""}</li>`)
                .join("")}
                        </ul>
                    </div>
            `
            : ""}
        `;
        this.insertBlockInShell("div", "shell__autocomplete", children);
        this.updateCommandShell(this.shellInput.value);
    }
    getCurrentDirectory() {
        return this.folders[this.currentDirectory[this.currentDirectory.length - 1]];
    }
    getFilesAndFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch("data/directorys.json");
            const data = yield res.json();
            this.directorysAndArchives = data;
            this.getFolderAndFilesAccordingDirectory();
        });
    }
    getFilesContent() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch("data/files.json");
            const data = yield res.json();
            this.filesContent = data;
        });
    }
    addListenerInputShell() {
        this.shell.addEventListener("keydown", event => {
            if (event.keyCode === 9) {
                event.preventDefault();
                this.setAutocomplete();
                return;
            }
            if (this.getHistory()) {
                if (event.keyCode === 38) {
                    this.historyNext();
                    return;
                }
                if (event.keyCode === 40) {
                    this.historyPrev();
                    return;
                }
            }
            if (event.ctrlKey && event.key === "c") {
                this.updateCommandShell();
            }
            if (event.key === "Enter") {
                this.actionsInput();
            }
        });
    }
    actionsInput() {
        const formatInput = this.getValueInput().replace(/( ).*/, "");
        const commandSelected = this.commands.find(command => command === formatInput) || "";
        switch (commandSelected) {
            case "cd":
                const folder = this.getValueInput().replace("cd ", "");
                if (folder === "..") {
                    this.returnDirectory();
                }
                else if (this.verifyFolder(folder)) {
                    this.enterInDirectory(folder);
                }
                else {
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
    verifyFolder(folder) {
        const directory = this.currentDirectory[this.currentDirectory.length - 1];
        return this.folders[directory].folders[folder] ? true : false;
    }
    readFile(file) {
        if (!this.filesContent.hasOwnProperty(file)) {
            this.shellCommandError("File not found");
            return;
        }
        if (!this.filesContent[file]) {
            this.shellCommandError("File not found");
            return;
        }
        if (this.currentDirectory.indexOf(this.filesContent[file].children) ===
            -1) {
            this.shellCommandError("File not found");
            return;
        }
        const content = this.filesContent[file];
        const children = `
            ${content.html}
        `;
        this.insertBlockInShell("div", "shell__file-content", children);
    }
    setAttributesInput() {
        this.shellInput.disabled = true;
        this.shellInput.setAttribute("value", this.shellInput.value);
        this.shellInput.dataset.disabled = "true";
    }
    getValueInput() {
        return this.shellInput.value;
    }
    clearShell() {
        this.shell.innerHTML = "";
    }
    updateCommandShell(initialValue) {
        if (this.getValueInput().length &&
            (this.getHistory() || []).indexOf(this.getValueInput()) === -1) {
            this.setHistory([
                ...(this.getHistory() || []),
                this.getValueInput(),
            ]);
            this.historyIndex = this.getHistoryIndex();
        }
        this.setAttributesInput();
        this.shell.innerHTML += this.shellCommandHtml();
        this.shellInput = document.querySelector(".shell__input input[data-disabled=false]");
        this.shellInput.value = initialValue || "";
        this.inputFocus();
    }
    shellCommandError(message = "Error: command not recognized") {
        this.insertBlockInShell("div", "shell__error", message);
    }
    onClickShell() {
        this.shell.addEventListener("click", () => {
            this.inputFocus();
        });
    }
    inputFocus() {
        this.shellInput.focus();
    }
    shellCommandHtml() {
        return `
            <div class="shell__command">
                <div class="shell__directory">Marlon@Franscisco:~/${this.currentDirectory.length > 1
            ? this.currentDirectory.join("/").replace("root/", "")
            : ""}$</div>
                <div class="shell__input">
                    <input type="text" data-disabled="false"/>
                </div>
            </div>
        `;
    }
    insertBlockInShell(element, className, children) {
        const el = document.createElement(element);
        el.className = className;
        el.innerHTML = children;
        this.shell.appendChild(el);
    }
    listDirectorysAndArchives() {
        const path = this.getCurrentDirectory();
        this.insertBlockInShell("ul", "shell__list", `
                    ${Object.keys(path.folders).map(folder => `<li class="folder">${folder}</li>`)}

                    ${path.files.map((file) => `<li class="file">${file}</li>`)}
                `);
    }
    listItemsHelper() {
        const children = `
            ${this.listHelper.map(help => `<li><span>${help.command}</span> - ${help.description}</li>`)}
        `;
        this.insertBlockInShell("ul", "shell__helper-list", children);
    }
    enterInDirectory(folder) {
        this.currentDirectory.push(folder);
        this.getFolderAndFilesAccordingDirectory();
    }
    returnDirectory() {
        if (this.currentDirectory.length > 1) {
            this.currentDirectory.splice(this.currentDirectory.length - 1, 1);
            this.getFolderAndFilesAccordingDirectory();
        }
        else {
            this.shellCommandError("You are in main directory");
        }
    }
    getFolderAndFilesAccordingDirectory(directorys = this.currentDirectory, currentPath) {
        if (this.folders.hasOwnProperty(directorys[directorys.length - 1])) {
            return;
        }
        directorys.forEach((directory, index) => {
            if (currentPath) {
                this.folders[directory] = currentPath.folders[directory];
                return;
            }
            if (this.directorysAndArchives[directory] &&
                this.directorysAndArchives[directory].folders) {
                this.folders[directory] = this.directorysAndArchives[directory];
                return;
            }
            else {
                const nextDirectorys = directorys.filter((value, i) => i >= index);
                this.getFolderAndFilesAccordingDirectory(nextDirectorys, this.directorysAndArchives[directorys[index - 1]]);
                return;
            }
        });
    }
}
