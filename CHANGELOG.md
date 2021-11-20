# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Unreleased/Upcoming]

- epinio api integration.
- manifest file detect and push.
- service and environment management.
- Push from workspace, manifest or project folder right click.
- Export manifest from a running app.
- Specify a buildpack to use.
- Bulk push, delete.
- Open app in browser automatically after push is successful. (Provide link in the pop up toast)
- Reload app in browser tab on Re-Push.
- Auto push when file change. (refer to Kustomize).
- E2E tests. Check on Gitpod.
- Add epinio install/uninstall buttons.
- telemetry.
- Official marketplace.

## [0.0.6]

### Added
- Added `Create`, `Delete` namespace features.
- Added `Push from manifest` functionality.
- On push, source folder is added to the Workspace
- Remember the source folder for subsequent re-pushes
- Added functionlity to `add`, `delete` epinio cluster connections via config files.
- Switch between Cluster connections.

## [0.0.5] - 2021-10-22

### Changed
- Updated README.md to make the installation instructions more readable.

## [0.0.4] - 2021-10-22

### Added
- Added progress spinners for `push` and `delete` operations.

### Changed
- Updated this changelog for the first time.
- README updates to improve installation instructions.
- Replaced the dummy activity bar icon with epinio icon.

## [0.0.3] - 2021-10-21

### Changed
- README.md updates to make the installation instructions clearer.

## [0.0.2] - 2021-10-21

### Added
- Added `+` option that lets users push apps from source.

### Changed
- Changed the extension implementation approach from relying on the open folders in workspace to leveraging `epinio app list` to generate the tree view.
- Code cleanup.

## [0.0.1] - 2021-10-15

### Added
- Initial release that has functionality to view apps in the treeview and run commands (Push, Logs, Delete etc) via the context menu.
