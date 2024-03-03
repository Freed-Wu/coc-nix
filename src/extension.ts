import * as vscode from "coc.nvim";
import { ExtensionContext } from "coc.nvim";
import { formattingProviders } from "./formatter";
import { startLinting } from "./linter";
import { config } from "./configuration";
import * as client from "./client";

/**
 * Activate this extension.
 *
 * If LSP is enabled
 *    then support IDE features with {@link https://github.com/nix-community/rnix-lsp|rnix-lsp}
 * Else
 *    Format with nixpkgs-format
 *    validate with nix-instantiate
 *
 * @param context The context for this extension
 * @return A promise for the initialization
 */
export async function activate(context: ExtensionContext): Promise<void> {
  if (config.LSPEnabled) {
    await client.activate(context);
  } else {
    await startLinting(context);
    const subs = [
      // vscode.languages.registerDocumentFormattingEditProvider,
      // vscode.languages.registerDocumentRangeFormattingEditProvider,
      vscode.languages.registerDocumentFormatProvider,
      vscode.languages.registerDocumentRangeFormatProvider,
    ].map((func) => func(["nix"], formattingProviders));
    context.subscriptions.concat(subs);
  }
}

export async function deactivate(): Promise<void> {
  if (config.LSPEnabled) {
    await client.deactivate();
  }
}
