import * as path from "path";
import { Uri, workspace } from "vscode";
import { FS_SCHEME, CONTENT_URI } from "./constants";
import { api } from "./git";
import { CodeTour, CodeTourStep, store } from "./store";

export function getFileUri(workspaceRoot: string, file: string) {
  let uri = Uri.parse(`${workspaceRoot}/${file}`);

  if (file.startsWith("..")) {
    // path.join/normalize will resolve relative paths (e.g. replacing
    // ".." with the actual directories), but it also messes up
    // non-file based schemes. So we parse the workspace root and
    // then replace it's path with a "joined" version of _only_ the path.
    uri = uri.with({
      path: path.normalize(uri.path)
    });
  }
  return uri;
}

export async function getStepFileUri(
  step: CodeTourStep,
  workspaceRoot: string,
  ref?: string
): Promise<Uri> {
  let uri;
  if (step.contents) {
    uri = Uri.parse(`${FS_SCHEME}://current/${step.file}`);
  } else if (step.uri || step.file) {
    uri = step.uri
      ? Uri.parse(step.uri)
      : getFileUri(workspaceRoot, step.file!);

    if (api && ref && ref !== "HEAD") {
      const repo = api.getRepository(uri);

      if (
        repo &&
        repo.state.HEAD &&
        repo.state.HEAD.name !== ref && // The tour refs the user's current branch
        repo.state.HEAD.commit !== ref && // The tour refs the user's HEAD commit
        repo.state.HEAD.commit !== // The tour refs a branch/tag that points at the user's HEAD commit
          repo.state.refs.find(gitRef => gitRef.name === ref)?.commit
      ) {
        uri = await api.toGitUri(uri, ref);
      }
    }
  } else {
    uri = CONTENT_URI;
  }

  return uri;
}

export function getActiveWorkspacePath() {
  return store.activeTour!.workspaceRoot?.toString() || "";
}

export function getWorkspaceKey() {
  return (
    workspace.workspaceFile || workspace.workspaceFolders![0].uri.toString()
  );
}

export function getWorkspacePath(tour: CodeTour) {
  return getWorkspaceUri(tour)?.toString() || "";
}

export function getWorkspaceUri(tour: CodeTour) {
  return workspace.getWorkspaceFolder(Uri.parse(tour.id))?.uri;
}
