import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { registerFileSystemProvider } from "./fileSystem";
import { registerTextDocumentContentProvider } from "./fileSystem/documentProvider";
import { initializeGitApi } from "./git";
import { registerDecorators } from "./player/decorator";
import { registerStatusBar } from "./player/status";
import { store } from "./store";
import {
  endCurrentCodeTour,
  exportTour,
  promptForTour,
  startCodeTour
} from "./store/actions";
import { discoverTours } from "./store/provider";
import { registerTreeProvider } from "./tree";

export async function activate(context: vscode.ExtensionContext) {
  registerCommands();

  // If the user has a workspace open, then attempt to discover
  // the tours contained within it and optionally prompt the user.
  if (vscode.workspace.workspaceFolders) {
    await discoverTours();

    promptForTour(context.globalState);

    registerDecorators();

    store.showMarkers = vscode.workspace
      .getConfiguration("codetour")
      .get("showMarkers", true);

    vscode.commands.executeCommand(
      "setContext",
      "codetour:showingMarkers",
      store.showMarkers
    );

    initializeGitApi();
  }

  // Regardless if the user has a workspace open,
  // we still need to register the following items
  // in order to support opening tour files and/or
  // enabling other extensions to start a tour.
  registerTreeProvider(context.extensionPath);
  registerFileSystemProvider();
  registerTextDocumentContentProvider();
  registerStatusBar();

  return {
    startTour: startCodeTour,
    exportTour,
    endCurrentTour: endCurrentCodeTour
  };
}
