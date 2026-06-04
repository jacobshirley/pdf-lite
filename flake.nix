{
  description = "pdf-lite dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        playwrightVersion = packageJson.devDependencies.playwright;
        nixPlaywrightVersion = pkgs.playwright-driver.version;
      in
      assert pkgs.lib.assertMsg
        (playwrightVersion == nixPlaywrightVersion)
        "playwright version mismatch: package.json has ${playwrightVersion} but nixpkgs has ${nixPlaywrightVersion}. Update nixpkgs pin or set playwright to ${nixPlaywrightVersion} in package.json.";
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_24
            pkgs.pnpm
          ];

          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          '';
        };
      });
}
