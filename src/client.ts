// from PR of https://github.com/nix-community/vscode-nix-ide/pull/16/

import { /* env, */ ExtensionContext, Uri, window, workspace, Thenable } from "coc.nvim";
import { LanguageClientOptions, LSPArray, ConfigurationParams } from "coc.nvim";
import { Executable, LanguageClient, ServerOptions } from "coc.nvim";
import { config, UriMessageItem } from "./configuration";

import commandExists = require("command-exists");

let client: LanguageClient;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function activate(_context: ExtensionContext): Promise<void> {
  if (!commandExists.sync(config.serverPath)) {
    const selection = await window.showErrorMessage<UriMessageItem>(
      `Command ${config.serverPath} not found in $PATH`,
      {
        title: "Install language server",
        uri: Uri.parse("https://github.com/nix-community/rnix-lsp"),
      }
    );
    if (selection?.uri !== undefined) {
      // await env.openExternal(selection?.uri);
      return;
    }
  }
  const serverExecutable: Executable = {
    command: config.serverPath,
  };
  const serverOptions: ServerOptions = serverExecutable;

  const nixDocumentSelector: { scheme: string; language: string }[] = [
    { scheme: "file", language: "nix" },
    { scheme: "untitled", language: "nix" },
  ];

  const clientOptions: LanguageClientOptions = {
    documentSelector: nixDocumentSelector,
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.nix"),
      configurationSection: [config.rootSection],
    },
    outputChannel: window.createOutputChannel("Nix"),
    middleware: {
      workspace: {
        configuration: (params: ConfigurationParams): LSPArray[] => {
          const items = params.items || [];
          const res: LSPArray = [];
          const settings = config.serverSettings;
          for (const item of items) {
            if (!item?.section) {
              continue;
            }
            res.push(settings[item.section as keyof typeof settings] ?? null);
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return res;
        },
      },
    },
  };

  client = new LanguageClient("nix", "Nix", serverOptions, clientOptions);
  // client.registerProposedFeatures();
  await client.start();

  // context.subscriptions.push(client);
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}
