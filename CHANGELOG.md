# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Unreleased/Upcoming]

- manifest file detect and push.
- Push from workspace, manifest or project folder right click.
- On Push, add source folder to workspace.
- Remember the source folder to avoid asking user every time the app is pushed.
- Add epinio install/uninstall buttons.
- Bulk push, delete.
- Open app in browser after push is successful.
- Reload app in browser tab on Re-Push.
- E2E tests.

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
